/**
 * OMA phase portal overview slice.
 *
 * Owns the postulant-facing dossier read model: preliminary status, visible
 * pre-evaluation artifacts, formal request requirements, progress, and meeting
 * summary blocks.
 */
import { toIso } from "../../../shared/utils/service.helpers.js";
import { getActiveTemplatesByFormCodes } from "../../document-templates/document-template.service.js";
import { DocumentModel } from "../../documents/document.model.js";
import { DocumentRequirementModel } from "../../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../../documents/document-submission.model.js";
import { MeetingModel } from "../../meetings/meeting.model.js";
import { PhasePaymentModel } from "../../payments/phase-payment.model.js";
import {
  FORMAL_REQUEST_PORTAL_LABELS,
  PRE_EVAL_VISIBLE_STATUSES,
  PRELIMINARY_STATUS_PORTAL_LABELS,
} from "../constants/preliminary.constants.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";

type PortalSubmission = {
  submissionId: string;
  uploadedAt: string;
  status: string;
  reviewComment?: string;
};

type PortalRequirement = {
  requirementId: string;
  code: string;
  label: string;
  formCode?: string;
  requirementLevel: string;
  isRepeatable: boolean;
  template?: { templateId: string; title: string; fileName: string };
  status: string;
  submissions: PortalSubmission[];
};

const PORTAL_ACTIVE_SUBMISSION_STATUSES = new Set([
  "submitted",
  "under_review",
  "validated",
  "requires_correction",
  "incomplete",
  "rejected",
]);

const computePortalReqStatus = (
  subs: Array<{ status: unknown }>,
): string => {
  const active = subs.filter((s) =>
    PORTAL_ACTIVE_SUBMISSION_STATUSES.has(String(s.status)),
  );
  if (active.length === 0) return "missing";
  return String(active[0].status);
};

const buildPortalFormalRequestBlock = async (
  dossierId: unknown,
  formalRequestPhase: unknown,
) => {
  let portalRequirements: PortalRequirement[] = [];
  let formalProgress = {
    totalTracked: 0,
    submitted: 0,
    validated: 0,
    missing: 0,
  };
  let formalMeetingBlock: {
    scheduledAt: string | null;
    location: string | null;
    status: string;
    notes: string | null;
  } | null = null;

  if (!formalRequestPhase) {
    return { portalRequirements, formalProgress, formalMeetingBlock };
  }

  const [rawReqs, rawSubs] = await Promise.all([
    DocumentRequirementModel.find({
      phaseKey: "formal_request",
      isActive: true,
      requirementLevel: { $ne: "gate" },
    }).sort({ sortOrder: 1 }).lean(),
    DocumentSubmissionModel.find({
      dossierId,
      phaseKey: "formal_request",
    }).sort({ createdAt: -1 }).lean(),
  ]);

  const subsByReq = new Map<
    string,
    Array<{
      status: unknown;
      _id: { toString(): string };
      createdAt?: unknown;
      reviewComment?: unknown;
    }>
  >();
  for (const s of rawSubs) {
    const key =
      (s as unknown as { requirementId?: { toString(): string } }).requirementId
        ?.toString() ?? "";
    if (!key) continue;
    const list = subsByReq.get(key) ?? [];
    list.push(
      s as unknown as {
        status: unknown;
        _id: { toString(): string };
        createdAt?: unknown;
        reviewComment?: unknown;
      },
    );
    subsByReq.set(key, list);
  }

  const formCodes = (rawReqs as unknown as Array<{ formCode?: unknown }>)
    .map((r) => (r.formCode ? String(r.formCode) : ""))
    .filter(Boolean);
  const templateMap = await getActiveTemplatesByFormCodes(formCodes);

  portalRequirements = (rawReqs as unknown as Array<{
    _id: { toString(): string };
    code: unknown;
    label: unknown;
    formCode?: unknown;
    requirementLevel: unknown;
    isRepeatable: unknown;
  }>).map((req) => {
    const reqId = req._id.toString();
    const subs = subsByReq.get(reqId) ?? [];
    const formCode = req.formCode ? String(req.formCode) : undefined;
    const templateEntry = formCode ? templateMap.get(formCode) : undefined;
    return {
      requirementId: reqId,
      code: String(req.code),
      label: String(req.label),
      formCode,
      requirementLevel: String(req.requirementLevel),
      isRepeatable: Boolean(req.isRepeatable),
      template: templateEntry,
      status: computePortalReqStatus(subs),
      submissions: subs.map((s) => ({
        submissionId: s._id.toString(),
        uploadedAt: toIso(s.createdAt as unknown) ?? new Date().toISOString(),
        status: String(s.status),
        reviewComment: s.reviewComment
          ? String(s.reviewComment)
          : undefined,
      })),
    };
  });

  const totalTracked = portalRequirements.length;
  const submitted = portalRequirements.filter(
    (r) => r.submissions.length > 0,
  ).length;
  const validated = portalRequirements.filter(
    (r) => r.status === "validated",
  ).length;
  const missing = portalRequirements.filter(
    (r) => r.requirementLevel === "expected" && r.status === "missing",
  ).length;
  formalProgress = { totalTracked, submitted, validated, missing };

  if (
    (formalRequestPhase as unknown as {
      formalMeetingId?: { toString(): string };
    }).formalMeetingId
  ) {
    const mtg = await MeetingModel.findById(
      (formalRequestPhase as unknown as {
        formalMeetingId: { toString(): string };
      }).formalMeetingId,
    ).lean();
    if (mtg) {
      formalMeetingBlock = {
        scheduledAt: toIso(mtg.scheduledAt) ?? null,
        location: mtg.location ? String(mtg.location) : null,
        status: String(mtg.status),
        notes: mtg.notes ? String(mtg.notes) : null,
      };
    }
  }

  return { portalRequirements, formalProgress, formalMeetingBlock };
};

export const getPortalDossier = async (dossierId: string, actor: Actor) => {
  const { dossier } = await getOwnedDossier(dossierId, actor);

  const phases = await OmaPhaseModel.find({ dossierId: dossier._id }).lean();
  const preliminaryPhase = phases.find((p) => p.phaseKey === "preliminary");
  const formalRequestPhase = phases.find(
    (p) => p.phaseKey === "formal_request",
  );
  const documentEvaluationPhase = phases.find(
    (p) => p.phaseKey === "document_evaluation",
  );

  const preliminaryStatus = preliminaryPhase?.preliminaryStatus ?? null;
  const portalLabel = preliminaryStatus
    ? (PRELIMINARY_STATUS_PORTAL_LABELS[preliminaryStatus] ??
      "En cours de traitement par l'ANAC")
    : "En cours de traitement par l'ANAC";

  const preEvaluationFormDocumentId =
    preliminaryPhase?.preEvaluationTemplateDocumentId &&
    PRE_EVAL_VISIBLE_STATUSES.has(preliminaryStatus ?? "")
      ? preliminaryPhase.preEvaluationTemplateDocumentId.toString()
      : null;
  const formalRequestStatus =
    (formalRequestPhase?.formalRequestStatus as string | null | undefined) ??
    (formalRequestPhase ? "formal_waiting_request" : null);
  const hasFormalRequestCourrier = Boolean(
    formalRequestPhase?.formalRequestCourrierId,
  );
  const canUploadFormalRequestCourrier = Boolean(
    preliminaryStatus === "preliminary_closed" &&
      formalRequestPhase &&
      formalRequestPhase.status !== "closed" &&
      !hasFormalRequestCourrier,
  );
  const formalRequestPortalLabel = canUploadFormalRequestCourrier
    ? "Demande formelle attendue"
    : hasFormalRequestCourrier
      ? (formalRequestStatus
        ? (FORMAL_REQUEST_PORTAL_LABELS[formalRequestStatus] ??
          "Demande formelle recue")
        : "Demande formelle recue")
      : formalRequestStatus
        ? (FORMAL_REQUEST_PORTAL_LABELS[formalRequestStatus] ??
          "Demande formelle en cours d'examen")
        : "En cours de traitement par l'ANAC";

  const { portalRequirements, formalProgress, formalMeetingBlock } =
    await buildPortalFormalRequestBlock(dossier._id, formalRequestPhase);

  const studyFeePayment = documentEvaluationPhase
    ? await PhasePaymentModel.findOne({
        dossierId: dossier._id,
        phaseKey: "document_evaluation",
        paymentType: "study_fee",
      }).lean()
    : null;
  const canUploadPaymentProof = Boolean(
    documentEvaluationPhase?.status === "in_progress" &&
      studyFeePayment?.status === "invoice_sent" &&
      studyFeePayment.invoiceDocumentId &&
      !studyFeePayment.paymentProofDocumentId,
  );

  let firstMeeting: {
    scheduledAt: string | null;
    heldAt: string | null;
    location: string | null;
    status: string;
    notes: string | null;
  } | null = null;
  let preliminaryMeeting: {
    scheduledAt: string | null;
    heldAt: string | null;
    location: string | null;
    status: string;
    notes: string | null;
  } | null = null;
  let firstMeetingReportDocumentId: string | null = null;

  if (preliminaryPhase) {
    if (preliminaryPhase.firstMeetingId) {
      const mtg = await MeetingModel.findById(
        preliminaryPhase.firstMeetingId,
      ).lean();
      if (mtg) {
        firstMeeting = {
          scheduledAt: toIso(mtg.scheduledAt) ?? null,
          heldAt: toIso(mtg.heldAt) ?? null,
          location: (mtg.location as string | undefined) ?? null,
          status: mtg.status as string,
          notes: (mtg.notes as string | undefined) ?? null,
        };
      }
    }

    if (preliminaryPhase.firstMeetingReportDocumentId) {
      const reportDoc = await DocumentModel.findById(
        preliminaryPhase.firstMeetingReportDocumentId,
      )
        .select("visibility")
        .lean();
      if (reportDoc?.visibility === "postulant_visible") {
        firstMeetingReportDocumentId =
          preliminaryPhase.firstMeetingReportDocumentId.toString();
      }
    }

    if (preliminaryPhase.preliminaryMeetingId) {
      const mtg = await MeetingModel.findById(
        preliminaryPhase.preliminaryMeetingId,
      ).lean();
      if (mtg) {
        preliminaryMeeting = {
          scheduledAt: toIso(mtg.scheduledAt) ?? null,
          heldAt: toIso(mtg.heldAt) ?? null,
          location: (mtg.location as string | undefined) ?? null,
          status: mtg.status as string,
          notes: (mtg.notes as string | undefined) ?? null,
        };
      }
    }
  }

  return {
    dossier: {
      id: dossier._id.toString(),
      dossierNumber: dossier.dossierNumber,
      dossierType: dossier.dossierType,
      status: dossier.status,
      openedAt: dossier.openedAt.toISOString(),
    },
    preliminary: {
      status: preliminaryStatus,
      portalLabel,
      preEvaluationFormDocumentId,
      firstMeetingReportDocumentId,
      hasCompletedForm: Boolean(
        preliminaryPhase?.completedPreEvaluationDocumentId,
      ),
      canSubmitForm: preliminaryStatus === "pre_eval_form_available",
      firstMeeting,
      preliminaryMeeting,
    },
    formalRequest: {
      status: formalRequestStatus,
      portalLabel: formalRequestPortalLabel,
      hasFormalRequestCourrier,
      canUploadFormalRequestCourrier,
      requirements: portalRequirements,
      progress: formalProgress,
      formalMeeting: formalMeetingBlock,
    },
    documentEvaluation: documentEvaluationPhase
      ? {
          status:
            (documentEvaluationPhase.documentEvaluationStatus as
              | string
              | null
              | undefined) ?? null,
          portalLabel: canUploadPaymentProof
            ? "Preuve de paiement attendue"
            : "Evaluation documentaire en cours",
          payment: {
            status: studyFeePayment ? String(studyFeePayment.status) : null,
            invoiceDocumentId:
              studyFeePayment?.invoiceDocumentId?.toString() ?? null,
            paymentProofDocumentId:
              studyFeePayment?.paymentProofDocumentId?.toString() ?? null,
            invoiceSentAt: studyFeePayment
              ? toIso(studyFeePayment.invoiceSentAt) ?? null
              : null,
            paymentProofSubmittedAt: studyFeePayment
              ? toIso(studyFeePayment.paymentProofSubmittedAt) ?? null
              : null,
          },
          canUploadPaymentProof,
        }
      : undefined,
  };
};
