/**
 * Delivery (Phase V) shared helpers.
 *
 * Owns certificate-delivery-fee payment response formatting and payment
 * bootstrap used by the delivery services. Mirrors inspection.helpers.ts's
 * payment slice, adapted for the "delivery" phaseKey /
 * "certificate_delivery_fee" paymentType.
 */
import { Types } from "mongoose";

import { toId, toIso } from "../../../shared/utils/service.helpers.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import type { GenericRecord } from "../types/oma.types.js";

export const findOrInitDeliveryPayment = async (
  dossierObjId: Types.ObjectId,
  phaseObjId: Types.ObjectId,
) => {
  let payment = await PhasePaymentModel.findOne({
    dossierId: dossierObjId,
    phaseId: phaseObjId,
    phaseKey: "delivery",
    paymentType: "certificate_delivery_fee",
  });
  if (!payment) {
    payment = await PhasePaymentModel.create({
      dossierId: dossierObjId,
      phaseId: phaseObjId,
      phaseKey: "delivery",
      paymentType: "certificate_delivery_fee",
      status: "invoice_pending",
    });
  }
  return payment;
};

export const computeDeliveryPaymentValidated = (payment: GenericRecord) =>
  String(payment.status) === "payment_proof_validated";

export const serializeDeliveryPayment = (payment: GenericRecord) => ({
  id: payment._id.toString(),
  paymentType: String(payment.paymentType),
  status: String(payment.status) as
    | "invoice_pending"
    | "invoice_sent"
    | "payment_proof_submitted"
    | "payment_proof_validated"
    | "payment_proof_rejected",
  invoiceDocumentId: toId(payment.invoiceDocumentId),
  paymentProofDocumentId: toId(payment.paymentProofDocumentId),
  invoiceSentAt: toIso(payment.invoiceSentAt),
  paymentProofSubmittedAt: toIso(payment.paymentProofSubmittedAt),
  paymentProofValidatedAt: toIso(payment.paymentProofValidatedAt),
  paymentProofRejectedAt: toIso(payment.paymentProofRejectedAt),
  paymentProofRejectionReason:
    (payment.paymentProofRejectionReason as string | null | undefined) ??
    undefined,
});
