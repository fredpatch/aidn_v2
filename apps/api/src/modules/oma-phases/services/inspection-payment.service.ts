/**
 * Inspection (Phase IV) payment slice.
 *
 * Owns audit-fee invoice publication by internal users and payment proof
 * submission/validation, mirroring document-evaluation-payment.service.ts's
 * two-step validation pattern. It does not own the R3 avis or phase closure -
 * see inspection-avis.service.ts and inspection-closure.service.ts.
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
import { DocumentModel } from "../../documents/document.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  computeInspectionPaymentValidated,
  findOrInitInspectionPayment,
  serializeInspectionPayment,
} from "../helpers/inspection.helpers.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";

export const getInspectionPaymentState = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier =
    await documentEvaluationRepository.findDossierByIdLean(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findInspectionPhaseByDossierIdLean(
      dossierObjId,
    );

  if (String(phase.status) !== "in_progress") {
    throw new HttpError(
      409,
      "La facturation de la phase IV sera disponible apres la cloture de l'evaluation approfondie.",
    );
  }

  const payment = await findOrInitInspectionPayment(
    dossierObjId,
    phase._id as Types.ObjectId,
  );
  const paymentRecord = payment as unknown as GenericRecord;
  const phaseRecord = phase as unknown as GenericRecord;

  return {
    phase: {
      id: (phase._id as Types.ObjectId).toString(),
      phaseKey: "inspection" as const,
      status: String(phase.status),
      inspectionStatus:
        (phase.inspectionStatus as string | null | undefined) ?? null,
    },
    payment: serializeInspectionPayment(paymentRecord),
    paymentValidated: computeInspectionPaymentValidated(paymentRecord),
    r3Avis: phaseRecord.r3AvisDecision
      ? {
          decision: phaseRecord.r3AvisDecision as "conforme" | "non_conforme",
          observations:
            (phaseRecord.r3AvisObservations as string | null | undefined) ??
            null,
          documentId: toId(phaseRecord.r3AvisDocumentId),
          recordedAt: toIso(phaseRecord.r3AvisRecordedAt) ?? null,
        }
      : null,
  };
};

export const getPortalInspectionPaymentState = async (
  dossierId: string,
  actor: Actor,
) => {
  const { dossier } = await getOwnedDossier(dossierId, actor);
  const dossierObjId = dossier._id as Types.ObjectId;

  const phase = await documentEvaluationRepository.findPhaseByKeyLean(
    dossierObjId,
    "inspection",
  );
  if (!phase) {
    throw new HttpError(404, "Phase d'inspection non disponible.");
  }

  const payment = await documentEvaluationRepository.findPhasePaymentOrNull(
    dossierObjId,
    "inspection",
    "audit_fee",
  );

  const paymentStatus = payment
    ? (String(payment.status) as
        | "invoice_pending"
        | "invoice_sent"
        | "payment_proof_submitted"
        | "payment_proof_validated"
        | "payment_proof_rejected")
    : "invoice_pending";

  const canUploadPaymentProof =
    paymentStatus === "invoice_sent" ||
    paymentStatus === "payment_proof_submitted" ||
    paymentStatus === "payment_proof_rejected";

  return {
    phaseStatus: String(phase.status),
    inspectionStatus:
      ((phase as unknown as GenericRecord).inspectionStatus as
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
      paymentProofRejectionReason: payment
        ? ((payment.paymentProofRejectionReason as string | null | undefined) ??
          undefined)
        : undefined,
    },
    canUploadPaymentProof,
  };
};

export const uploadAuditFeeInvoice = async (
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
    await documentEvaluationRepository.findInspectionPhaseByDossierIdLean(
      dossierObjId,
    );

  if (String(phase.status) !== "in_progress") {
    throw new HttpError(
      409,
      "La facture ne peut etre televersee qu'apres la cloture de l'evaluation approfondie.",
    );
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const payment = await findOrInitInspectionPayment(dossierObjId, phaseObjId);

  if (String(payment.status) === "payment_proof_submitted") {
    throw new HttpError(
      409,
      "Une preuve de paiement a deja ete deposee. La facture ne peut plus etre modifiee.",
    );
  }

  const now = new Date();
  const title = `Facture frais d'audit - ${String(dossier.dossierNumber)}`;
  const invoiceDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "invoice",
    documentType: "audit_fee_invoice",
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

  phase.inspectionStatus = "inspection_waiting_payment" as never;
  await phase.save();

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Facture de frais d'audit disponible",
      message:
        "Une facture de frais d'audit est disponible pour votre dossier. Veuillez la consulter et deposer votre preuve de paiement.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "inspection.audit_fee_invoice_uploaded",
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
      phaseKey: "inspection" as const,
      status: String(phase.status),
      inspectionStatus: String(phase.inspectionStatus),
    },
    payment: serializeInspectionPayment(paymentRecord),
    paymentValidated: computeInspectionPaymentValidated(paymentRecord),
  };
};

export const uploadAuditFeePaymentProof = async (
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
    "inspection",
  );
  if (!phase) {
    throw new HttpError(404, "Phase d'inspection non disponible.");
  }
  if (phase.status === "closed") {
    throw new HttpError(409, "La phase d'inspection est deja cloturee.");
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const payment = await documentEvaluationRepository.findPhasePaymentOrNull(
    dossierObjId,
    "inspection",
    "audit_fee",
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
  const title = `Preuve de paiement audit - ${String(
    (dossier as unknown as GenericRecord).dossierNumber,
  )}`;
  const proofDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "payment_proof",
    documentType: "audit_fee_payment_proof",
    title,
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: postulantUserId,
  });

  const paymentDoc = await PhasePaymentModel.findById(payment._id);
  if (!paymentDoc) {
    throw new HttpError(409, "Payment record not found.");
  }

  const previousProofDocumentId = paymentDoc.paymentProofDocumentId;
  if (previousProofDocumentId) {
    await DocumentModel.updateOne(
      { _id: previousProofDocumentId },
      { $set: { status: "archived", replacedByDocumentId: proofDocumentId } },
    );
  }

  paymentDoc.paymentProofDocumentId = proofDocumentId;
  paymentDoc.paymentProofUploadedById = postulantUserId;
  paymentDoc.paymentProofSubmittedAt = now;
  paymentDoc.status = "payment_proof_submitted" as never;
  await paymentDoc.save();

  phase.inspectionStatus = "inspection_payment_proof_submitted" as never;
  await phase.save();

  const dossierRecord = dossier as unknown as GenericRecord;
  if (dossierRecord.assignedDnAgentId) {
    await NotificationModel.create({
      recipientUserId: dossierRecord.assignedDnAgentId,
      channel: "in_app",
      title: "Preuve de paiement (audit) recue",
      message: `Une preuve de paiement des frais d'audit a ete deposee pour le dossier n ${String(
        dossierRecord.dossierNumber,
      )}.`,
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "inspection.audit_fee_payment_proof_uploaded",
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
    inspectionStatus: String(phase.inspectionStatus),
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

export const validateAuditFeePaymentProof = async (
  dossierId: string,
  input: {
    decision: "validated" | "rejected";
    observations?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");
  const dossier =
    await documentEvaluationRepository.findDossierById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findInspectionPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;

  const payment = await PhasePaymentModel.findOne({
    dossierId: dossierObjId,
    phaseId: phaseObjId,
    phaseKey: "inspection",
    paymentType: "audit_fee",
  });
  if (!payment) {
    throw new HttpError(409, "Aucun paiement en attente pour ce dossier.");
  }
  if (String(payment.status) !== "payment_proof_submitted") {
    throw new HttpError(
      409,
      "Une preuve de paiement doit etre deposee avant de pouvoir etre validee.",
    );
  }

  const now = new Date();
  const observations = input.observations?.trim() || undefined;

  if (input.decision === "validated") {
    payment.status = "payment_proof_validated" as never;
    payment.paymentProofValidatedAt = now as unknown as typeof payment.paymentProofValidatedAt;
    payment.paymentProofValidatedById =
      actorObjId as unknown as typeof payment.paymentProofValidatedById;
    payment.paymentProofRejectedAt = null as unknown as typeof payment.paymentProofRejectedAt;
    payment.paymentProofRejectedById = null as unknown as typeof payment.paymentProofRejectedById;
    payment.paymentProofRejectionReason =
      null as unknown as typeof payment.paymentProofRejectionReason;
    await payment.save();

    phase.inspectionStatus = "inspection_awaiting_r3_avis" as never;
    await phase.save();
  } else {
    payment.status = "payment_proof_rejected" as never;
    payment.paymentProofRejectedAt = now as unknown as typeof payment.paymentProofRejectedAt;
    payment.paymentProofRejectedById =
      actorObjId as unknown as typeof payment.paymentProofRejectedById;
    payment.paymentProofRejectionReason =
      (observations ??
        "Preuve de paiement rejetee.") as unknown as typeof payment.paymentProofRejectionReason;
    await payment.save();

    phase.inspectionStatus = "inspection_waiting_payment" as never;
    await phase.save();

    const dossierRecord = dossier as unknown as GenericRecord;
    if (dossierRecord.postulantUserId) {
      await NotificationModel.create({
        recipientUserId: dossierRecord.postulantUserId,
        channel: "in_app",
        title: "Preuve de paiement (audit) rejetee",
        message:
          "Votre preuve de paiement des frais d'audit a ete rejetee. Veuillez deposer une nouvelle preuve.",
        relatedType: "phase",
        relatedId: phaseObjId,
        status: "unread",
      });
    }
  }

  await writeAuditLog({
    action: "inspection.audit_fee_payment_proof_reviewed",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      decision: input.decision,
      hasObservations: Boolean(observations),
    },
  });

  const paymentRecord = payment as unknown as GenericRecord;
  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "inspection" as const,
      status: String(phase.status),
      inspectionStatus: String(phase.inspectionStatus),
    },
    payment: serializeInspectionPayment(paymentRecord),
    paymentValidated: computeInspectionPaymentValidated(paymentRecord),
  };
};
