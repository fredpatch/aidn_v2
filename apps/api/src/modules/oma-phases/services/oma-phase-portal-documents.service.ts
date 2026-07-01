/**
 * OMA phase portal document slice.
 *
 * Owns postulant download visibility rules for preliminary documents, Phase III
 * payment documents, and document-evaluation correction submissions.
 */
import { HttpError } from "../../../shared/errors/http-error.js";
import { storageAdapter } from "../../../shared/storage/storage.adapter.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { DocumentModel } from "../../documents/document.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { CertificateModel } from "../../certificates/certificate.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";

export const downloadPortalDossierDocument = async (
  dossierId: string,
  documentId: string,
  actor: Actor,
) => {
  await getOwnedDossier(dossierId, actor);

  const docObjectId = ensureObjectId(documentId, "documentId");
  const doc = await DocumentModel.findById(docObjectId).lean();

  if (!doc) throw new HttpError(404, "Document introuvable");
  if (doc.visibility !== "postulant_visible") {
    throw new HttpError(403, "Document non accessible");
  }

  const dossierObjectId = ensureObjectId(dossierId, "dossierId");
  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjectId,
    phaseKey: "preliminary",
  }).lean();
  if (!phase) throw new HttpError(403, "Document non accessible");

  const isLinkedToPhase =
    phase.preEvaluationTemplateDocumentId?.toString() === doc._id.toString() ||
    phase.firstMeetingReportDocumentId?.toString() === doc._id.toString();

  if (!isLinkedToPhase) {
    const allowedOwnerIds = [
      phase._id,
      phase.firstMeetingId,
      phase.preliminaryMeetingId,
    ]
      .filter(Boolean)
      .map((id) => id!.toString());

    if (!allowedOwnerIds.includes(doc.ownerId.toString())) {
      const phasePayment = await PhasePaymentModel.findOne({
        dossierId: dossierObjectId,
        $or: [
          { invoiceDocumentId: docObjectId },
          { paymentProofDocumentId: docObjectId },
        ],
      })
        .select("_id")
        .lean();

      if (!phasePayment) {
        const correctionSubmission = await DocumentSubmissionModel.findOne({
          dossierId: dossierObjectId,
          documentId: docObjectId,
          phaseKey: "document_evaluation",
          status: { $nin: ["replaced", "archived"] },
        })
          .select("_id")
          .lean();

        if (!correctionSubmission) {
          const deliveryPhase = await OmaPhaseModel.findOne({
            dossierId: dossierObjectId,
            phaseKey: "delivery",
            $or: [
              { deliveryClosureCourrierDocumentId: docObjectId },
              { deliveryApprovalDocumentId: docObjectId },
            ],
          })
            .select("_id")
            .lean();

          if (!deliveryPhase) {
            const certificate = await CertificateModel.findOne({
              dossierId: dossierObjectId,
              $or: [
                { linkedDocumentId: docObjectId },
                { signedDocumentId: docObjectId },
              ],
            })
              .select("_id")
              .lean();

            if (!certificate) {
              throw new HttpError(403, "Document non accessible");
            }
          }
        }
      }
    }
  }

  const buffer = await storageAdapter.getBuffer(doc.storageKey as string);

  return {
    buffer,
    mimeType: doc.mimeType as string,
    fileName: doc.fileName as string,
  };
};
