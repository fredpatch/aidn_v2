/**
 * Document evaluation payment slice.
 *
 * Owns Phase III study-fee invoice publication by internal users and payment
 * proof submission by the postulant. It does not own document review.
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
import { NotificationModel } from "../../notifications/notification.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  computeDocumentEvaluationCanStart,
  findOrInitDocumentEvaluationPayment,
  serializeDocumentEvaluationPayment,
} from "../helpers/document-evaluation.helpers.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";

export const getDocumentEvaluationPaymentState = async (
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
  const payment = await findOrInitDocumentEvaluationPayment(
    dossierObjId,
    phase._id as Types.ObjectId,
  );
  const paymentRecord = payment as unknown as GenericRecord;

  return {
    phase: {
      id: (phase._id as Types.ObjectId).toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus:
        (phase.documentEvaluationStatus as string | null | undefined) ?? null,
    },
    payment: serializeDocumentEvaluationPayment(paymentRecord),
    canStartDocumentEvaluation:
      computeDocumentEvaluationCanStart(paymentRecord),
  };
};

export const getPortalDocumentEvaluationPaymentState = async (
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
    paymentStatus === "invoice_sent" ||
    paymentStatus === "payment_proof_submitted";

  return {
    phaseStatus: String(phase.status),
    documentEvaluationStatus:
      ((phase as unknown as GenericRecord).documentEvaluationStatus as
        | string
        | null) ?? null,
    payment: {
      status: paymentStatus,
      invoiceDocumentId: payment ? toId(payment.invoiceDocumentId) : undefined,
      paymentProofDocumentId: payment
        ? toId(payment.paymentProofDocumentId)
        : undefined,
      invoiceSentAt: payment ? toIso(payment.invoiceSentAt) : undefined,
      paymentProofSubmittedAt: payment
        ? toIso(payment.paymentProofSubmittedAt)
        : undefined,
    },
    canUploadPaymentProof,
  };
};

export const uploadStudyFeeInvoice = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: {
    invoiceReference?: string;
    issuedAt?: string;
    amount?: string;
    currency?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  if (!file) throw new HttpError(400, "Un fichier de facture est requis.");

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");
  const dossier =
    await documentEvaluationRepository.findDossierById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findDocEvalPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;
  const payment = await findOrInitDocumentEvaluationPayment(
    dossierObjId,
    phaseObjId,
  );

  if (String(payment.status) === "payment_proof_submitted") {
    throw new HttpError(
      409,
      "Une preuve de paiement a deja ete deposee. La facture ne peut plus etre modifiee.",
    );
  }

  const now = new Date();
  const title = `Facture frais d'etude - ${String(dossier.dossierNumber)}`;
  const invoiceDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "invoice",
    documentType: "study_fee_invoice",
    title,
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: actorObjId,
  });

  payment.invoiceDocumentId =
    invoiceDocumentId as unknown as typeof payment.invoiceDocumentId;
  payment.invoiceUploadedById =
    actorObjId as unknown as typeof payment.invoiceUploadedById;
  payment.invoiceSentAt = now as unknown as typeof payment.invoiceSentAt;
  payment.status = "invoice_sent" as never;
  await payment.save();

  phase.documentEvaluationStatus =
    "document_evaluation_waiting_payment" as never;
  await phase.save();

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Facture de frais d'etude disponible",
      message:
        "Une facture de frais d'etude est disponible pour votre dossier. Veuillez la consulter et deposer votre preuve de paiement.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "document_evaluation.study_fee_invoice_uploaded",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      invoiceDocumentId: invoiceDocumentId.toString(),
      invoiceReference: payload.invoiceReference,
    },
  });

  const paymentRecord = payment as unknown as GenericRecord;
  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: String(phase.status),
      documentEvaluationStatus: String(phase.documentEvaluationStatus),
    },
    payment: serializeDocumentEvaluationPayment(paymentRecord),
    canStartDocumentEvaluation:
      computeDocumentEvaluationCanStart(paymentRecord),
  };
};

export const uploadStudyFeePaymentProof = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: {
    paymentReference?: string;
    paidAt?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  const { dossier, portalUser } = await getOwnedDossier(dossierId, actor);
  if (!file) {
    throw new HttpError(400, "Un fichier de preuve de paiement est requis.");
  }

  const dossierObjId = dossier._id as Types.ObjectId;
  const postulantUserId = portalUser.userId as Types.ObjectId;
  const phase = await documentEvaluationRepository.findPhaseByKey(
    dossierObjId,
    "document_evaluation",
  );
  if (!phase) {
    throw new HttpError(404, "Phase d'evaluation approfondie non disponible.");
  }
  if (phase.status === "closed") {
    throw new HttpError(
      409,
      "La phase d'evaluation approfondie est deja cloturee.",
    );
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const payment = await documentEvaluationRepository.findPhasePaymentOrNull(
    dossierObjId,
    "document_evaluation",
    "study_fee",
  );

  if (!payment) {
    throw new HttpError(
      409,
      "Aucune facture n'a encore ete emise pour ce dossier.",
    );
  }
  if (!payment.invoiceDocumentId) {
    throw new HttpError(
      409,
      "La facture doit etre disponible avant de deposer la preuve de paiement.",
    );
  }

  const now = new Date();
  const title = `Preuve de paiement - ${String(
    (dossier as unknown as GenericRecord).dossierNumber,
  )}`;
  const proofDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "payment_proof",
    documentType: "study_fee_payment_proof",
    title,
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: postulantUserId,
  });

  // Fetch the payment document (not lean) to allow saving
  const paymentDoc = await PhasePaymentModel.findById(payment._id);
  if (!paymentDoc) {
    throw new HttpError(409, "Payment record not found.");
  }

  paymentDoc.paymentProofDocumentId = proofDocumentId;
  paymentDoc.paymentProofUploadedById = postulantUserId;
  paymentDoc.paymentProofSubmittedAt = now;
  paymentDoc.status = "payment_proof_submitted" as never;
  await paymentDoc.save();

  phase.documentEvaluationStatus =
    "document_evaluation_payment_proof_submitted" as never;
  await phase.save();

  const dossierRecord = dossier as unknown as GenericRecord;
  if (dossierRecord.assignedDnAgentId) {
    await NotificationModel.create({
      recipientUserId: dossierRecord.assignedDnAgentId,
      channel: "in_app",
      title: "Preuve de paiement recue",
      message: `Une preuve de paiement a ete deposee pour le dossier n ${String(
        dossierRecord.dossierNumber,
      )}.`,
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "document_evaluation.study_fee_payment_proof_uploaded",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      proofDocumentId: proofDocumentId.toString(),
      paymentReference: payload.paymentReference,
    },
  });

  const paymentRecord = payment as unknown as GenericRecord;
  return {
    phaseStatus: String(phase.status),
    documentEvaluationStatus: String(phase.documentEvaluationStatus),
    payment: {
      status: String(paymentDoc.status) as "payment_proof_submitted",
      invoiceDocumentId: toId(paymentRecord.invoiceDocumentId),
      paymentProofDocumentId: toId(proofDocumentId),
      invoiceSentAt: toIso(paymentRecord.invoiceSentAt),
      paymentProofSubmittedAt: toIso(now),
    },
    canUploadPaymentProof: true,
  };
};
