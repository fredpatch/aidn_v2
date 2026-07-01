/**
 * Document evaluation portal correction slice.
 *
 * Owns postulant correction uploads for non-satisfactory evaluations and the
 * portal Phase III state view.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import {
  ensureObjectId,
  toId,
  toIso,
} from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import {
  computeDocumentEvaluationProgress,
  hasDocumentEvaluationPaymentGatePassed,
  syncEvaluationStatus,
  type DocumentEvaluationStatus,
} from "../helpers/document-evaluation.helpers.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";

export const uploadDocumentEvaluationCorrection = async (
  evaluationId: string,
  file: Express.Multer.File | undefined,
  payload: { notes?: string },
  actor: Actor,
) => {
  void payload;
  if (!file) throw new HttpError(400, "Un fichier de correction est requis.");

  const evaluationObjId = ensureObjectId(evaluationId, "Evaluation ID");
  const evaluation =
    await documentEvaluationRepository.findDocumentEvaluationById(
      evaluationObjId,
    );
  if (!evaluation) throw new HttpError(404, "Evaluation introuvable.");

  const dossierObjId = evaluation.dossierId as unknown as Types.ObjectId;
  const { dossier, portalUser } = await getOwnedDossier(
    dossierObjId.toString(),
    actor,
  );
  const postulantUserId = portalUser.userId as Types.ObjectId;

  const phase = await documentEvaluationRepository.findPhaseById(
    evaluation.phaseId,
  );
  if (!phase) throw new HttpError(404, "Phase d'evaluation introuvable.");
  if (String(phase.status) === "closed") {
    throw new HttpError(
      409,
      "La phase d'evaluation approfondie est deja cloturee.",
    );
  }

  const currentStatus = String(evaluation.status);
  if (currentStatus !== "non_satisfaisant") {
    throw new HttpError(
      409,
      "La correction ne peut etre deposee que pour un document marque non satisfaisant.",
    );
  }
  if (!evaluation.annotation?.trim()) {
    throw new HttpError(
      409,
      "Le document doit comporter une annotation DN avant de pouvoir deposer une correction.",
    );
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const now = new Date();
  const dossierRecord = dossier as unknown as GenericRecord;
  const title = `Document corrige - ${String(dossierRecord.dossierNumber)}`;
  const correctionDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierObjId.toString()}/evaluations/${evaluationId}`,
    ownerType: "phase",
    ownerId: phaseObjId,
    category: "form",
    documentType: "corrected_document",
    title,
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: postulantUserId,
  });

  const submission = await DocumentSubmissionModel.create({
    dossierId: dossierObjId,
    phaseId: phaseObjId,
    phaseKey: "document_evaluation",
    requirementId: evaluation.requirementId,
    documentId: correctionDocumentId,
    submittedById: postulantUserId,
    submittedByRole: "postulant",
    source: "portal_upload",
    status: "submitted",
  });

  const oldSubmissionId = toId(
    evaluation.submissionId as unknown as GenericRecord | null | undefined,
  );

  evaluation.submissionId =
    submission._id as unknown as typeof evaluation.submissionId;
  evaluation.correctionSubmissionId =
    submission._id as unknown as typeof evaluation.correctionSubmissionId;
  evaluation.correctionSubmittedAt =
    now as unknown as typeof evaluation.correctionSubmittedAt;
  evaluation.correctionSubmittedById =
    postulantUserId as unknown as typeof evaluation.correctionSubmittedById;
  evaluation.status = "correction_submitted" as never;
  await evaluation.save();

  await syncEvaluationStatus(phaseObjId, phase);

  if (dossierRecord.assignedDnAgentId) {
    await NotificationModel.create({
      recipientUserId: dossierRecord.assignedDnAgentId,
      channel: "in_app",
      title: "Document corrige depose",
      message: `Un document corrige a ete depose pour le dossier n ${String(
        dossierRecord.dossierNumber,
      )}.`,
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "document_evaluation.correction_submitted",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: phaseObjId.toString(),
      evaluationId,
      requirementId: evaluation.requirementId?.toString(),
      oldSubmissionId,
      newSubmissionId: submission._id.toString(),
      newDocumentId: correctionDocumentId.toString(),
      submittedById: postulantUserId.toString(),
    },
  });

  return {
    uploaded: true,
    evaluation: {
      id: evaluationObjId.toString(),
      status: "correction_submitted" as const,
      correctionSubmissionId: submission._id.toString(),
      currentSubmissionId: submission._id.toString(),
      currentDocumentId: correctionDocumentId.toString(),
    },
    document: {
      id: correctionDocumentId.toString(),
      fileName: file.originalname,
    },
    submission: {
      id: submission._id.toString(),
      status: "submitted" as const,
    },
  };
};

export const getPortalDocumentEvaluationState = async (
  dossierId: string,
  actor: Actor,
) => {
  const { dossier } = await getOwnedDossier(dossierId, actor);
  const dossierObjId = dossier._id as Types.ObjectId;

  const phase = await documentEvaluationRepository.findPhaseByKeyLean(
    dossierObjId,
    "document_evaluation",
  );
  if (!phase) {
    throw new HttpError(404, "Phase d'evaluation approfondie non disponible.");
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const docEvalStatus = String(
    (phase as unknown as GenericRecord).documentEvaluationStatus ?? "",
  );
  const phaseClosed = String(phase.status) === "closed";
  const payment = await documentEvaluationRepository.findPhasePaymentOrNull(
    dossierObjId,
    "document_evaluation",
    "study_fee",
  );

  const paymentStatus = payment
    ? (String(payment.status) as
        | "invoice_pending"
        | "invoice_sent"
        | "payment_proof_submitted")
    : "invoice_pending";
  const canUploadPaymentProof =
    !phaseClosed &&
    (paymentStatus === "invoice_sent" ||
      paymentStatus === "payment_proof_submitted");

  type PortalEvalEntry = {
    evaluationId: string;
    requirementLabel: string;
    requirementCode: string | null;
    formCode: string | null;
    status: DocumentEvaluationStatus;
    annotation: string | null;
    correctionRequestedAt: string | null;
    correctionSubmittedAt: string | null;
    canUploadCorrection: boolean;
  };

  let evaluations: PortalEvalEntry[] = [];
  let progress = {
    total: 0,
    pending: 0,
    satisfaisant: 0,
    nonSatisfaisant: 0,
    correctionSubmitted: 0,
  };

  if (hasDocumentEvaluationPaymentGatePassed(docEvalStatus)) {
    const rawEvaluations =
      await documentEvaluationRepository.findDocumentEvaluationsByPhaseIdLean(
        phaseObjId,
      );
    const reqIds = rawEvaluations
      .map((e) => e.requirementId)
      .filter(Boolean) as Types.ObjectId[];
    const requirements =
      await documentEvaluationRepository.findDocumentRequirementsByIds(reqIds);
    const reqMap = new Map(requirements.map((r) => [r._id.toString(), r]));

    evaluations = rawEvaluations.map((ev) => {
      const req = reqMap.get(ev.requirementId?.toString() ?? "");
      const status = String(ev.status) as DocumentEvaluationStatus;
      const annotation = (ev.annotation as string | null | undefined) ?? null;
      const canUploadCorrection =
        !phaseClosed && status === "non_satisfaisant" && Boolean(annotation);

      return {
        evaluationId: ev._id.toString(),
        requirementLabel: req ? String(req.label) : "Document evalue",
        requirementCode: req ? String(req.code) : null,
        formCode: req?.formCode ? String(req.formCode) : null,
        status,
        annotation,
        correctionRequestedAt:
          toIso(
            ev.correctionRequestedAt as unknown as
              | GenericRecord
              | null
              | undefined,
          ) ?? null,
        correctionSubmittedAt:
          toIso(
            ev.correctionSubmittedAt as unknown as
              | GenericRecord
              | null
              | undefined,
          ) ?? null,
        canUploadCorrection,
      };
    });

    progress = computeDocumentEvaluationProgress(evaluations);
  }

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus: docEvalStatus || null,
    },
    payment: {
      status: paymentStatus,
      invoiceDocumentId: payment ? toId(payment.invoiceDocumentId) : null,
      paymentProofDocumentId: payment
        ? toId(payment.paymentProofDocumentId)
        : null,
      invoiceSentAt: payment ? toIso(payment.invoiceSentAt) : null,
      paymentProofSubmittedAt: payment
        ? toIso(payment.paymentProofSubmittedAt)
        : null,
    },
    canUploadPaymentProof,
    evaluations,
    progress,
  };
};
