/**
 * Inspection (Phase IV) shared helpers.
 *
 * Owns audit-fee payment response formatting and payment bootstrap used by
 * the inspection services. Mirrors document-evaluation.helpers.ts's payment
 * slice, adapted for the "inspection" phaseKey / "audit_fee" paymentType.
 */
import { Types } from "mongoose";

import { toId, toIso } from "../../../shared/utils/service.helpers.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import type { GenericRecord } from "../types/oma.types.js";

export const findOrInitInspectionPayment = async (
  dossierObjId: Types.ObjectId,
  phaseObjId: Types.ObjectId,
) => {
  let payment = await PhasePaymentModel.findOne({
    dossierId: dossierObjId,
    phaseId: phaseObjId,
    phaseKey: "inspection",
    paymentType: "audit_fee",
  });
  if (!payment) {
    payment = await PhasePaymentModel.create({
      dossierId: dossierObjId,
      phaseId: phaseObjId,
      phaseKey: "inspection",
      paymentType: "audit_fee",
      status: "invoice_pending",
    });
  }
  return payment;
};

// Payment being validated is a necessary but not sufficient condition to
// close the phase - closing also requires the R3 avis to be recorded (see
// computeInspectionCanClose in inspection-avis service). This only reflects
// whether R3 review can begin.
export const computeInspectionPaymentValidated = (payment: GenericRecord) =>
  String(payment.status) === "payment_proof_validated";

export const serializeInspectionPayment = (payment: GenericRecord) => ({
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
