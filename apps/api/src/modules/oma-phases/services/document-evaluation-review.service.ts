/**
 * Document evaluation review slice.
 *
 * Owns DN/admin initialization, listing, and review of Phase III document
 * evaluations. Portal correction uploads live in the correction slice.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import {
  ensureObjectId,
  toId,
  toIso,
} from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { DOCUMENT_EVALUATION_REVIEW_STATUSES } from "../constants/document-evaluation.constants.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  computeDocumentEvaluationProgress,
  hasDocumentEvaluationPaymentGatePassed,
  initializeDocumentEvaluations,
  syncEvaluationStatus,
  type DocumentEvaluationStatus,
} from "../helpers/document-evaluation.helpers.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";

export const getDocumentEvaluations = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier =
    await documentEvaluationRepository.findDossierByIdLean(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findDocEvalPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;
  const docEvalStatus = String(phase.documentEvaluationStatus ?? "");
  if (hasDocumentEvaluationPaymentGatePassed(docEvalStatus)) {
    await initializeDocumentEvaluations(dossierObjId, phase);
  }

  const evaluations =
    await documentEvaluationRepository.findDocumentEvaluationsByPhaseIdLean(
      phaseObjId,
    );

  const reqIds = evaluations
    .map((e) => e.requirementId)
    .filter(Boolean) as Types.ObjectId[];
  const subIds = evaluations
    .map((e) => e.submissionId)
    .filter(Boolean) as Types.ObjectId[];
  const corrSubIds = evaluations
    .map((e) => e.correctionSubmissionId)
    .filter(Boolean) as Types.ObjectId[];

  const [requirements, submissions, correctionSubmissions] = await Promise.all([
    documentEvaluationRepository.findDocumentRequirementsByIds(reqIds),
    documentEvaluationRepository.findDocumentSubmissionsByIds(subIds),
    corrSubIds.length > 0
      ? documentEvaluationRepository.findDocumentSubmissionsByIds(corrSubIds)
      : Promise.resolve([]),
  ]);

  const reqMap = new Map(requirements.map((r) => [r._id.toString(), r]));
  const subMap = new Map(submissions.map((s) => [s._id.toString(), s]));
  const corrSubMap = new Map(
    correctionSubmissions.map((s) => [s._id.toString(), s]),
  );

  const serialized = evaluations.map((ev) => {
    const req = reqMap.get(ev.requirementId?.toString() ?? "");
    const sub = subMap.get(ev.submissionId?.toString() ?? "");
    const corrSubIdStr =
      (
        ev.correctionSubmissionId as unknown as
          | Types.ObjectId
          | null
          | undefined
      )?.toString() ?? "";
    const corrSub = corrSubIdStr
      ? (corrSubMap.get(corrSubIdStr) ?? null)
      : null;
    return {
      id: ev._id.toString(),
      status: String(ev.status) as DocumentEvaluationStatus,
      annotation: ev.annotation ?? null,
      reviewedById: toId(
        ev.reviewedById as unknown as GenericRecord | null | undefined,
      ),
      reviewedAt: toIso(
        ev.reviewedAt as unknown as GenericRecord | null | undefined,
      ),
      requirementId: ev.requirementId?.toString() ?? null,
      requirement: req
        ? {
            code: String(req.code),
            label: String(req.label),
            requirementLevel: String(req.requirementLevel),
            documentType: String(req.documentType),
          }
        : null,
      submissionId: ev.submissionId?.toString() ?? null,
      submission: sub
        ? {
            documentId: sub.documentId?.toString() ?? null,
            status: String(sub.status),
          }
        : null,
      correctionSubmissionId: toId(
        ev.correctionSubmissionId as unknown as
          | GenericRecord
          | null
          | undefined,
      ),
      correctionDocument: corrSub
        ? {
            documentId: (corrSub as unknown as GenericRecord).documentId
              ? String((corrSub as unknown as GenericRecord).documentId)
              : null,
          }
        : null,
    };
  });

  const progress = computeDocumentEvaluationProgress(serialized);

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus:
        (phase.documentEvaluationStatus as string | null | undefined) ?? null,
    },
    evaluations: serialized,
    progress: {
      total: progress.total,
      pending: progress.pending,
      satisfaisant: progress.satisfaisant,
      nonSatisfaisant: progress.nonSatisfaisant,
    },
  };
};

export const reviewDocumentEvaluation = async (
  dossierId: string,
  evaluationId: string,
  payload: {
    status: "satisfaisant" | "non_satisfaisant";
    annotation?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  if (!DOCUMENT_EVALUATION_REVIEW_STATUSES.has(payload.status)) {
    throw new HttpError(400, "Statut d'evaluation invalide.");
  }
  if (payload.status === "non_satisfaisant" && !payload.annotation?.trim()) {
    throw new HttpError(
      400,
      "Une annotation est requise pour un resultat non satisfaisant.",
    );
  }

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const evaluationObjId = ensureObjectId(evaluationId, "Evaluation ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const dossier =
    await documentEvaluationRepository.findDossierByIdLean(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findDocEvalPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;

  const evaluation =
    await documentEvaluationRepository.findDocumentEvaluationByIdInPhase(
      evaluationObjId,
      phaseObjId,
    );
  if (!evaluation) throw new HttpError(404, "Evaluation introuvable.");

  const now = new Date();
  evaluation.status = payload.status as never;
  evaluation.annotation = (payload.annotation?.trim() ?? null) as never;
  evaluation.reviewedById =
    actorObjId as unknown as typeof evaluation.reviewedById;
  evaluation.reviewedAt = now as unknown as typeof evaluation.reviewedAt;
  if (payload.status === "non_satisfaisant") {
    evaluation.correctionRequestedAt =
      now as unknown as typeof evaluation.correctionRequestedAt;
  }
  await evaluation.save();

  await syncEvaluationStatus(phaseObjId, phase);

  await writeAuditLog({
    action: `document_evaluation.evaluation_${payload.status}`,
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      evaluationId,
      status: payload.status,
      annotation: payload.annotation,
    },
  });

  return {
    id: evaluationObjId.toString(),
    status: payload.status,
    annotation: evaluation.annotation ?? null,
    reviewedById: actorObjId.toString(),
    reviewedAt: now.toISOString(),
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus:
        (phase.documentEvaluationStatus as string | null | undefined) ?? null,
    },
  };
};
