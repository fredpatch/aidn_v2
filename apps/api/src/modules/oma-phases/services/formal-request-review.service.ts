/**
 * Formal request DN review slice.
 *
 * Owns DN validation of the OMA approval form submission only. Other Phase II
 * supporting documents are consultation evidence, while the gate courrier is
 * handled by the courrier/DG workflow slices.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";

import { REVIEW_STATUSES } from "../constants/formal-request.constants.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  assertPhaseNotClosed,
} from "../helpers/formal-request.helpers.js";
import { notifyDossierPostulant } from "../helpers/notification.helpers.js";
import { formalRequestRepository } from "../repository/formal-request.repository.js";
import type { Actor } from "../types/oma.types.js";

export const reviewFormalRequestDocumentSubmission = async (
  submissionId: string,
  actor: Actor,
  payload: {
    status: "validated" | "requires_correction" | "incomplete";
    comment?: string;
  },
) => {
  ensureInternalActor(actor);

  if (!REVIEW_STATUSES.has(payload.status)) {
    throw new HttpError(
      400,
      "Statut de revue non autorisé pour la demande formelle.",
    );
  }
  if (
    (payload.status === "requires_correction" ||
      payload.status === "incomplete") &&
    !payload.comment?.trim()
  ) {
    throw new HttpError(
      400,
      "Un commentaire est requis pour correction ou incomplet.",
    );
  }

  const submissionObjId = ensureObjectId(submissionId, "Submission ID");
  const submission =
    await formalRequestRepository.findSubmissionById(submissionObjId);
  if (!submission) throw new HttpError(404, "Soumission introuvable.");

  if (submission.phaseKey !== "formal_request") {
    throw new HttpError(
      400,
      "Seules les soumissions de la phase de demande formelle peuvent être examinées via cet endpoint.",
    );
  }
  if (submission.status === "archived" || submission.status === "replaced") {
    throw new HttpError(
      409,
      "Cette soumission est archivée ou remplacée et ne peut plus être examinée.",
    );
  }

  if (submission.requirementId) {
    const requirement = await formalRequestRepository.findRequirementById(
      submission.requirementId as Types.ObjectId,
    );
    if (requirement && String(requirement.requirementLevel) === "gate") {
      throw new HttpError(
        409,
        "La demande formelle est traitée via le circuit courrier dédié.",
      );
    }
    if (requirement && String(requirement.code) !== "oma_approval_form") {
      throw new HttpError(
        400,
        "Cette pièce est consultative et ne nécessite pas de validation.",
      );
    }
  }

  const documentObjId = submission.documentId as Types.ObjectId;
  const document = await formalRequestRepository.findDocumentById(documentObjId);
  if (!document) throw new HttpError(404, "Document lié introuvable.");

  const phase = await formalRequestRepository.findPhaseById(submission.phaseId);
  if (!phase) throw new HttpError(404, "Phase introuvable.");
  assertPhaseNotClosed(phase);

  const dossier = await formalRequestRepository.findDossierByIdLean(
    submission.dossierId as Types.ObjectId,
  );
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const now = new Date();
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  submission.status = payload.status as never;
  submission.reviewComment = (payload.comment?.trim() || undefined) as never;
  submission.reviewedById = actorObjId as never;
  submission.reviewedAt = now as never;
  await submission.save();

  document.status = payload.status as never;
  await document.save();

  if (
    payload.status === "requires_correction" ||
    payload.status === "incomplete"
  ) {
    await notifyDossierPostulant(dossier, {
      title:
        payload.status === "requires_correction"
          ? "Correction demandée"
          : "Document incomplet",
      message:
        payload.status === "requires_correction"
          ? "Une correction est demandée sur le formulaire de demande d'agrément d'OMA. Veuillez consulter la note et téléverser une nouvelle version."
          : "Le formulaire de demande d'agrément d'OMA est incomplet. Veuillez consulter la note et téléverser une version complétée.",
      relatedType: "document",
      relatedId: documentObjId,
    });
  }

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.supporting_document_reviewed",
    entityType: "dossier",
    entityId: submission.dossierId as Types.ObjectId,
    metadata: {
      dossierId: (submission.dossierId as Types.ObjectId).toString(),
      phaseId: (submission.phaseId as Types.ObjectId).toString(),
      requirementId: submission.requirementId
        ? (submission.requirementId as Types.ObjectId).toString()
        : null,
      documentId: documentObjId.toString(),
      submissionId: submissionObjId.toString(),
      status: payload.status,
      reviewerId: actor.id,
    },
  });

  return {
    submission: {
      id: submissionObjId.toString(),
      status: payload.status,
      reviewComment: payload.comment?.trim() || undefined,
      reviewedAt: now.toISOString(),
      reviewedById: actor.id,
    },
    document: {
      id: documentObjId.toString(),
      status: payload.status,
    },
  };
};
