/**
 * Delivery (Phase V) payment slice.
 *
 * Owns certificate-delivery-fee invoice publication by internal users and
 * payment proof submission/validation. Same two-step validation pattern as
 * Phase III/IV, with one key difference: validating the payment here
 * directly creates the Certificate record (certificate.service.ts) and
 * kicks off its own lifecycle. Phase closure is handled separately in
 * delivery-closure.service.ts and does not happen until the certificate
 * has actually been collected.
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
import { createCertificateForDossier } from "../../certificates/certificate.service.js";
import { DocumentModel } from "../../documents/document.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  computeDeliveryPaymentValidated,
  findOrInitDeliveryPayment,
  serializeDeliveryPayment,
} from "../helpers/delivery.helpers.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";

export const getDeliveryPaymentState = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier =
    await documentEvaluationRepository.findDossierByIdLean(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findDeliveryPhaseByDossierIdLean(
      dossierObjId,
    );

  if (String(phase.status) !== "in_progress") {
    throw new HttpError(
      409,
      "La facturation de la phase V sera disponible apres la cloture de l'inspection.",
    );
  }

  const payment = await findOrInitDeliveryPayment(
    dossierObjId,
    phase._id as Types.ObjectId,
  );
  const paymentRecord = payment as unknown as GenericRecord;

  return {
    phase: {
      id: (phase._id as Types.ObjectId).toString(),
      phaseKey: "delivery" as const,
      status: String(phase.status),
      deliveryStatus:
        (phase.deliveryStatus as string | null | undefined) ?? null,
    },
    payment: serializeDeliveryPayment(paymentRecord),
    paymentValidated: computeDeliveryPaymentValidated(paymentRecord),
  };
};

export const getPortalDeliveryPaymentState = async (
  dossierId: string,
  actor: Actor,
) => {
  const { dossier } = await getOwnedDossier(dossierId, actor);
  const dossierObjId = dossier._id as Types.ObjectId;

  const phase = await documentEvaluationRepository.findPhaseByKeyLean(
    dossierObjId,
    "delivery",
  );
  if (!phase) {
    throw new HttpError(404, "Phase de delivrance non disponible.");
  }

  const payment = await documentEvaluationRepository.findPhasePaymentOrNull(
    dossierObjId,
    "delivery",
    "certificate_delivery_fee",
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
    deliveryStatus:
      ((phase as unknown as GenericRecord).deliveryStatus as
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

export const uploadCertificateDeliveryFeeInvoice = async (
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
    await documentEvaluationRepository.findDeliveryPhaseByDossierIdLean(
      dossierObjId,
    );

  if (String(phase.status) !== "in_progress") {
    throw new HttpError(
      409,
      "La facture ne peut etre televersee qu'apres la cloture de l'inspection.",
    );
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const payment = await findOrInitDeliveryPayment(dossierObjId, phaseObjId);

  if (String(payment.status) === "payment_proof_submitted") {
    throw new HttpError(
      409,
      "Une preuve de paiement a deja ete deposee. La facture ne peut plus etre modifiee.",
    );
  }

  const now = new Date();
  const title = `Facture frais de delivrance - ${String(dossier.dossierNumber)}`;
  const invoiceDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "invoice",
    documentType: "certificate_delivery_fee_invoice",
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

  phase.deliveryStatus = "delivery_waiting_payment" as never;
  await phase.save();

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Facture de frais de delivrance disponible",
      message:
        "Une facture de frais de delivrance du certificat est disponible pour votre dossier. Veuillez la consulter et deposer votre preuve de paiement.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "delivery.certificate_fee_invoice_uploaded",
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
      phaseKey: "delivery" as const,
      status: String(phase.status),
      deliveryStatus: String(phase.deliveryStatus),
    },
    payment: serializeDeliveryPayment(paymentRecord),
    paymentValidated: computeDeliveryPaymentValidated(paymentRecord),
  };
};

export const uploadCertificateDeliveryFeePaymentProof = async (
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
    "delivery",
  );
  if (!phase) {
    throw new HttpError(404, "Phase de delivrance non disponible.");
  }
  if (phase.status === "closed") {
    throw new HttpError(409, "La phase de delivrance est deja cloturee.");
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const payment = await documentEvaluationRepository.findPhasePaymentOrNull(
    dossierObjId,
    "delivery",
    "certificate_delivery_fee",
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
  const title = `Preuve de paiement delivrance - ${String(
    (dossier as unknown as GenericRecord).dossierNumber,
  )}`;
  const proofDocumentId = await saveDocument({
    file,
    ownerPath: `dossiers/${dossierId}/phase-payments`,
    ownerType: "phase_payment",
    ownerId: payment._id,
    category: "payment_proof",
    documentType: "certificate_delivery_fee_payment_proof",
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

  phase.deliveryStatus = "delivery_payment_proof_submitted" as never;
  await phase.save();

  const dossierRecord = dossier as unknown as GenericRecord;
  if (dossierRecord.assignedDnAgentId) {
    await NotificationModel.create({
      recipientUserId: dossierRecord.assignedDnAgentId,
      channel: "in_app",
      title: "Preuve de paiement (delivrance) recue",
      message: `Une preuve de paiement des frais de delivrance a ete deposee pour le dossier n ${String(
        dossierRecord.dossierNumber,
      )}.`,
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "delivery.certificate_fee_payment_proof_uploaded",
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
    deliveryStatus: String(phase.deliveryStatus),
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

export const validateCertificateDeliveryFeePaymentProof = async (
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
    await documentEvaluationRepository.findDeliveryPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;

  const payment = await PhasePaymentModel.findOne({
    dossierId: dossierObjId,
    phaseId: phaseObjId,
    phaseKey: "delivery",
    paymentType: "certificate_delivery_fee",
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
  let certificateId: string | undefined;

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

    // Validating payment is what actually starts the certificate - the
    // phase stays "in progress" through the whole print/sign/archive/
    // collect cycle since time-to-deliver is the KPI, it does not wait
    // for a separate "ready to close" step.
    phase.deliveryStatus = "delivery_certificate_in_progress" as never;
    await phase.save();

    const certificate = await createCertificateForDossier(
      dossierObjId,
      phaseObjId,
      actor,
    );
    certificateId = (certificate._id as Types.ObjectId).toString();
  } else {
    payment.status = "payment_proof_rejected" as never;
    payment.paymentProofRejectedAt = now as unknown as typeof payment.paymentProofRejectedAt;
    payment.paymentProofRejectedById =
      actorObjId as unknown as typeof payment.paymentProofRejectedById;
    payment.paymentProofRejectionReason =
      (observations ??
        "Preuve de paiement rejetee.") as unknown as typeof payment.paymentProofRejectionReason;
    await payment.save();

    phase.deliveryStatus = "delivery_waiting_payment" as never;
    await phase.save();

    const dossierRecord = dossier as unknown as GenericRecord;
    if (dossierRecord.postulantUserId) {
      await NotificationModel.create({
        recipientUserId: dossierRecord.postulantUserId,
        channel: "in_app",
        title: "Preuve de paiement (delivrance) rejetee",
        message:
          "Votre preuve de paiement des frais de delivrance a ete rejetee. Veuillez deposer une nouvelle preuve.",
        relatedType: "phase",
        relatedId: phaseObjId,
        status: "unread",
      });
    }
  }

  await writeAuditLog({
    action: "delivery.certificate_fee_payment_proof_reviewed",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      decision: input.decision,
      hasObservations: Boolean(observations),
      certificateId,
    },
  });

  const paymentRecord = payment as unknown as GenericRecord;
  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "delivery" as const,
      status: String(phase.status),
      deliveryStatus: String(phase.deliveryStatus),
    },
    payment: serializeDeliveryPayment(paymentRecord),
    paymentValidated: computeDeliveryPaymentValidated(paymentRecord),
    certificateId,
  };
};
