/**
 * OMA phase admin read/download slice.
 *
 * Owns admin dossier list/detail composition and server-side document download
 * guards across preliminary evidence, formal request submissions, Phase III
 * payments, and document-evaluation submissions.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { storageAdapter } from "../../../shared/storage/storage.adapter.js";
import { ensureObjectId, toId, toIso } from "../../../shared/utils/service.helpers.js";
import { CourrierModel } from "../../courriers/courrier.model.js";
import { CertificateModel } from "../../certificates/certificate.model.js";
import { DGReviewModel } from "../../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../../documents/document.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { MeetingModel } from "../../meetings/meeting.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import { RequestModel } from "../../requests/request.model.js";
import { ADMIN_PRELIMINARY_DOWNLOAD_FIELDS } from "../constants/preliminary.constants.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  sanitizeDossierSummary,
  sanitizeDocumentEvidence,
  sanitizeMeeting,
  sanitizePhase,
} from "../helpers/oma-phase.formatters.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";

const buildPreliminaryDocumentEvidence = async (phase: GenericRecord) => {
  const fields = [
    { key: "preEvaluationTemplateDocument", idField: "preEvaluationTemplateDocumentId" },
    { key: "completedPreEvaluationDocument", idField: "completedPreEvaluationDocumentId" },
    { key: "preEvaluationDgAnnotatedDocument", idField: "preEvaluationDgAnnotatedDocumentId" },
    { key: "firstMeetingReportDocument", idField: "firstMeetingReportDocumentId" },
    { key: "preliminaryMeetingReportDocument", idField: "preliminaryMeetingReportDocumentId" },
    { key: "closureCourrierDocument", idField: "closureCourrierDocumentId" },
  ] as const;

  const results: Record<string, ReturnType<typeof sanitizeDocumentEvidence> | null> = {};

  await Promise.all(
    fields.map(async ({ key, idField }) => {
      const docId = phase[idField] as Types.ObjectId | undefined;
      if (!docId) {
        results[key] = null;
        return;
      }
      const doc = await DocumentModel.findById(docId)
        .select("title fileName documentType category uploadedAt uploadedById visibility status")
        .lean();
      results[key] = doc
        ? sanitizeDocumentEvidence(docId, doc as unknown as GenericRecord)
        : null;
    }),
  );

  return results;
};

const buildDossierCourriers = async (requestId: unknown) => {
  const requestObjectId =
    requestId instanceof Types.ObjectId ? requestId : undefined;
  if (!requestObjectId) return undefined;

  const request = await RequestModel.findById(requestObjectId).lean();
  if (!request) return undefined;

  const courrier = request.initialCourrierId
    ? await CourrierModel.findOne({
        _id: request.initialCourrierId,
        requestId: requestObjectId,
      }).lean()
    : await CourrierModel.findOne({
        requestId: requestObjectId,
        type: "initial_request_courrier",
      }).lean();

  const initialDocumentId =
    toId(request.initialDocumentId) ?? toId(courrier?.documentId);
  const initialDocument = initialDocumentId
    ? await DocumentModel.findById(initialDocumentId).select("title").lean()
    : undefined;

  const dgReview = request.initialDgReviewId
    ? await DGReviewModel.findById(request.initialDgReviewId).lean()
    : await DGReviewModel.findOne({
        requestId: requestObjectId,
        targetType: "initial_request",
      })
        .sort({ createdAt: -1 })
        .lean();

  return {
    initialCourrier: {
      requestId: requestObjectId.toString(),
      documentId: initialDocumentId,
      title: initialDocument?.title ?? "Courrier initial",
      source: courrier?.source ?? request.courrierSource,
      reference: courrier?.officialReference,
      date:
        toIso(courrier?.scannedAt) ??
        toIso(courrier?.physicalDepositDate) ??
        toIso(courrier?.uploadedAt) ??
        toIso(request.submittedAt) ??
        toIso(request.createdAt),
    },
    initialDgOrientation: {
      requestId: requestObjectId.toString(),
      documentId: toId(dgReview?.returnedScannedDocumentId),
      title: "Retour DG orientation initiale",
      decision: dgReview?.decision,
      returnedAt: toIso(dgReview?.returnedFromDgAt),
      observations: dgReview?.observations,
    },
  };
};

export const listAdminDossiers = async (
  filters: { status?: string; dossierType?: string; search?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.dossierType) query.dossierType = filters.dossierType;

  const dossiers = await DossierModel.find(query)
    .populate("organizationId", "canonicalName status")
    .populate("postulantUserId", "fullName email")
    .sort({ createdAt: -1 })
    .lean();

  let items = dossiers.map((d) =>
    sanitizeDossierSummary(d as unknown as GenericRecord),
  );

  if (filters.search) {
    const search = filters.search.toLowerCase();
    items = items.filter((d) => {
      const org = d.organization as { canonicalName?: unknown } | undefined;
      const postulant = d.postulant as { fullName?: unknown } | undefined;
      return (
        String(d.dossierNumber ?? "")
          .toLowerCase()
          .includes(search) ||
        String(org?.canonicalName ?? "")
          .toLowerCase()
          .includes(search) ||
        String(postulant?.fullName ?? "")
          .toLowerCase()
          .includes(search)
      );
    });
  }

  return { items };
};

export const getAdminDossier = async (dossierId: string, actor: Actor) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"))
    .populate("organizationId", "canonicalName status legalAddress email phone")
    .populate("postulantUserId", "fullName email phone")
    .lean();

  if (!dossier) {
    throw new HttpError(404, "Dossier introuvable");
  }

  const phases = await OmaPhaseModel.find({ dossierId: dossier._id }).lean();
  const preliminaryPhase = phases.find((p) => p.phaseKey === "preliminary");

  let firstMeeting = null;
  let preliminaryMeeting = null;
  if (preliminaryPhase) {
    if (preliminaryPhase.firstMeetingId) {
      firstMeeting = await MeetingModel.findById(
        preliminaryPhase.firstMeetingId,
      ).lean();
    }
    if (preliminaryPhase.preliminaryMeetingId) {
      preliminaryMeeting = await MeetingModel.findById(
        preliminaryPhase.preliminaryMeetingId,
      ).lean();
    }
  }

  const [courriers, documentEvidence] = await Promise.all([
    buildDossierCourriers(dossier.requestId),
    preliminaryPhase
      ? buildPreliminaryDocumentEvidence(preliminaryPhase as unknown as GenericRecord)
      : Promise.resolve(null),
  ]);

  return {
    dossier: sanitizeDossierSummary(dossier as unknown as GenericRecord),
    phases: phases.map((p) => sanitizePhase(p as unknown as GenericRecord)),
    preliminary: preliminaryPhase
      ? {
          phase: sanitizePhase(preliminaryPhase as unknown as GenericRecord),
          firstMeeting: firstMeeting
            ? sanitizeMeeting(firstMeeting as unknown as GenericRecord)
            : null,
          preliminaryMeeting: preliminaryMeeting
            ? sanitizeMeeting(preliminaryMeeting as unknown as GenericRecord)
            : null,
          documentEvidence,
        }
      : null,
    courriers,
  };
};

export const downloadAdminDossierDocument = async (
  dossierId: string,
  documentId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjectId = ensureObjectId(dossierId, "dossierId");
  const docObjectId = ensureObjectId(documentId, "documentId");

  const dossier = await DossierModel.findById(dossierObjectId)
    .select("_id")
    .lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossierObjectId,
    phaseKey: "preliminary",
  }).lean();
  if (!phase) throw new HttpError(404, "Phase préliminaire introuvable");

  const requestedDocumentId = docObjectId.toString();
  const isLinkedToPreliminaryEvidence = ADMIN_PRELIMINARY_DOWNLOAD_FIELDS.some(
    (field) => phase[field]?.toString() === requestedDocumentId,
  );

  if (!isLinkedToPreliminaryEvidence) {
    const formalSubmission = await DocumentSubmissionModel.findOne({
      dossierId: dossierObjectId,
      documentId: docObjectId,
      phaseKey: "formal_request",
      status: { $nin: ["replaced", "archived"] },
    })
      .select("_id")
      .lean();

    if (!formalSubmission) {
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
        const docEvalSubmission = await DocumentSubmissionModel.findOne({
          dossierId: dossierObjectId,
          documentId: docObjectId,
          phaseKey: "document_evaluation",
          status: { $nin: ["replaced", "archived"] },
        })
          .select("_id")
          .lean();

        if (!docEvalSubmission) {
          const inspectionPhase = await OmaPhaseModel.findOne({
            dossierId: dossierObjectId,
            phaseKey: "inspection",
            r3AvisDocumentId: docObjectId,
          })
            .select("_id")
            .lean();

          if (!inspectionPhase) {
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
  }

  const doc = await DocumentModel.findById(docObjectId).lean();
  if (!doc) throw new HttpError(404, "Document introuvable");

  const buffer = await storageAdapter.getBuffer(doc.storageKey as string);
  return {
    buffer,
    mimeType: doc.mimeType as string,
    fileName: doc.fileName as string,
  };
};
