import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { saveDocument } from "../../shared/utils/document.helpers.js";
import { ensureObjectId, toId, toIso } from "../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../audit/audit.service.js";
import {
  createDgReview,
  recordDgDecision,
  recordDgReturn,
} from "../dg-circuit/dg-circuit.service.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DGReviewModel } from "../dg-reviews/dg-review.model.js";
import { DocumentModel } from "../documents/document.model.js";
import { DocumentRequirementModel } from "../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../documents/document-submission.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { MeetingModel } from "../meetings/meeting.model.js";
import { NotificationModel } from "../notifications/notification.model.js";
import { getOwnedDossier } from "./oma-phase.service.js";
import { OmaPhaseModel } from "./oma-phase.model.js";

export type Actor = { id: string; role: string; userType: "internal" | "postulant" };
type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
};

const validateFile = (file: Express.Multer.File | undefined) => {
  if (!file) throw new HttpError(400, "Un fichier est requis.");
};

const ACTIVE_SUBMISSION_STATUSES = new Set([
  "submitted",
  "under_review",
  "validated",
  "requires_correction",
  "incomplete",
]);

/**
 * Phase 2 statuses that confirm DG evidence is recorded.
 * Used by both canClosePhase and the closeFormalRequestPhase guard
 * so they always apply the same rule.
 */
const FORMAL_DG_EVIDENCE_STATUSES = new Set([
  "formal_dg_returned",
  "formal_dg_decision_recorded",
  "formal_meeting_invited",
  "formal_meeting_held",
  "formal_recevability_recorded",
  "formal_ready_to_close",
  "formal_requires_correction",
  "formal_closed",
]);

const computeRequirementStatus = (submissions: GenericRecord[]): string => {
  const active = submissions
    .filter((s) => ACTIVE_SUBMISSION_STATUSES.has(String(s.status)))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(String(a.createdAt)).getTime() : 0;
      const bTime = b.createdAt ? new Date(String(b.createdAt)).getTime() : 0;
      return bTime - aTime;
    });

  if (active.length === 0) return "missing";
  return String(active[0].status);
};

export const getAdminFormalRequestPhase = async (dossierId: string, actor: Actor) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");

  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = (await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "formal_request",
  }).lean()) as unknown as GenericRecord | null;

  if (!phase) throw new HttpError(404, "Phase de demande formelle non initialisée.");

  // ── Requirements ──────────────────────────────────────────────────────────

  const [rawRequirements, rawSubmissions] = await Promise.all([
    DocumentRequirementModel.find({ phaseKey: "formal_request", isActive: true })
      .sort({ sortOrder: 1 })
      .lean(),
    DocumentSubmissionModel.find({ dossierId: dossierObjId, phaseKey: "formal_request" }).lean(),
  ]);

  const requirements = rawRequirements as unknown as GenericRecord[];
  const submissions = rawSubmissions as unknown as GenericRecord[];

  const submissionsByReq = new Map<string, GenericRecord[]>();
  for (const sub of submissions) {
    const reqId = toId(sub.requirementId);
    if (!reqId) continue;
    const list = submissionsByReq.get(reqId) ?? [];
    list.push(sub);
    submissionsByReq.set(reqId, list);
  }

  // ── Gate ──────────────────────────────────────────────────────────────────

  const gateExists = !!phase.formalRequestCourrierId;

  let gateCourrier: GenericRecord | null = null;
  if (phase.formalRequestCourrierId) {
    gateCourrier = (await CourrierModel.findById(
      phase.formalRequestCourrierId,
    ).lean()) as unknown as GenericRecord;
  }

  // ── Meeting ───────────────────────────────────────────────────────────────

  let formalMeeting: GenericRecord | null = null;
  if (phase.formalMeetingId) {
    formalMeeting = (await MeetingModel.findById(phase.formalMeetingId).lean()) as unknown as GenericRecord;
  }

  // ── DG Review ─────────────────────────────────────────────────────────────

  let formalDgReview: GenericRecord | null = null;
  if (phase.formalRequestDgReviewId) {
    formalDgReview = (await DGReviewModel.findById(phase.formalRequestDgReviewId).lean()) as unknown as GenericRecord;
  }

  // ── Action gates ──────────────────────────────────────────────────────────

  const canSendToDg = gateExists && !phase.formalRequestDgReviewId;

  // formal_dg_returned is treated as decision-available for MVP (scan = evidence)
  const canInviteFormalMeeting =
    phase.formalRequestStatus === "formal_dg_decision_recorded" ||
    phase.formalRequestStatus === "formal_dg_returned";

  // MVP collapsed DG flow: DG evidence = scanned return (no separate "approved" decision)
  const dgEvidenceReady = FORMAL_DG_EVIDENCE_STATUSES.has(
    (phase.formalRequestStatus as string | undefined) ?? "",
  );
  const meetingHeld = formalMeeting ? String(formalMeeting.status) === "held" : false;
  const meetingReportUploaded = Boolean(phase.formalMeetingReportDocumentId);

  // ── Build requirement list ─────────────────────────────────────────────────

  const requirementList = requirements.map((req) => {
    const reqId = req._id.toString();
    const reqSubmissions = submissionsByReq.get(reqId) ?? [];
    const status = computeRequirementStatus(reqSubmissions);

    return {
      requirementId: reqId,
      code: String(req.code),
      label: String(req.label),
      formCode: req.formCode ? String(req.formCode) : undefined,
      requirementLevel: String(req.requirementLevel) as
        | "gate"
        | "expected"
        | "optional"
        | "conditional",
      documentType: String(req.documentType),
      isRepeatable: Boolean(req.isRepeatable),
      status,
      submissions: reqSubmissions.map((s) => ({
        submissionId: s._id.toString(),
        documentId: toId(s.documentId) ?? "",
        uploadedAt: toIso(s.createdAt),
        status: String(s.status),
        uploadedById: toId(s.submittedById),
        source: String(s.source),
        reviewComment: s.reviewComment ? String(s.reviewComment) : undefined,
      })),
    };
  });

  // ── Can close phase ────────────────────────────────────────────────────────

  const nonGateRequiredReqs = requirementList.filter(
    (r) => r.requirementLevel !== "gate" && r.requirementLevel !== "optional",
  );
  const allRequiredDeposited = nonGateRequiredReqs.every((r) => r.status !== "missing");
  const omaFormValidated =
    requirementList.find((r) => r.code === "oma_approval_form")?.status === "validated";

  const canClosePhase = !!(
    phase.formalRequestCourrierId &&
    dgEvidenceReady &&
    meetingHeld &&
    meetingReportUploaded &&
    allRequiredDeposited &&
    omaFormValidated
  );

  // ── Progress ──────────────────────────────────────────────────────────────

  const totalTracked = requirementList.length;
  const submitted = requirementList.filter((r) => r.submissions.length > 0).length;
  const validated = requirementList.filter((r) => r.status === "validated").length;
  const missing = requirementList.filter((r) => r.submissions.length === 0).length;
  const completionRate =
    totalTracked > 0 ? Math.round((submitted / totalTracked) * 100) : 0;
  const blockingMissing = !gateExists;

  return {
    phase: {
      id: phase._id.toString(),
      phaseKey: "formal_request" as const,
      status: String(phase.status),
      formalRequestStatus:
        (phase.formalRequestStatus as string | null | undefined) ?? null,
      canSendToDg,
      canInviteFormalMeeting,
      canClosePhase,
    },
    gate: {
      exists: gateExists,
      formalRequestCourrierId: toId(phase.formalRequestCourrierId),
      source: gateCourrier
        ? (String(gateCourrier.source) as
            | "portal_upload"
            | "physical_deposit"
            | "internal_scan"
            | undefined)
        : undefined,
      receivedAt: gateCourrier
        ? toIso(gateCourrier.uploadedAt ?? gateCourrier.physicalDepositDate)
        : undefined,
    },
    requirements: requirementList,
    meeting: formalMeeting
      ? {
          id: formalMeeting._id.toString(),
          status: String(formalMeeting.status),
          scheduledAt: toIso(formalMeeting.scheduledAt),
          location: formalMeeting.location ? String(formalMeeting.location) : undefined,
          outlookEmailStatus: formalMeeting.outlookEmailStatus
            ? String(formalMeeting.outlookEmailStatus)
            : undefined,
          outlookEmailSentAt: toIso(formalMeeting.outlookEmailSentAt),
          reportDocumentId: toId(formalMeeting.reportDocumentId),
        }
      : null,
    progress: {
      totalTracked,
      submitted,
      validated,
      missing,
      completionRate,
      blockingMissing,
    },
    closure: {
      recevabilityCourrierDocumentId: toId(phase.recevabilityCourrierDocumentId),
      phaseClosureCourrierDocumentId: toId(phase.phaseClosureCourrierDocumentId),
      canClosePhase,
    },
  };
};

// ── OMA-FORMAL-2: Register formal request courrier ────────────────────────────

type CourrierSource = "portal_upload" | "physical_deposit" | "internal_scan";

export const registerFormalRequestCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: {
    source: CourrierSource;
    officialReference?: string;
    physicalDepositDate?: string;
    notes?: string;
  },
  actor: Actor,
) => {
  validateFile(file);

  // ── Resolve dossier + ownership ──────────────────────────────────────────

  let resolvedDossierId: Types.ObjectId;
  let submittedByRole: string;
  let submittedById: Types.ObjectId;

  if (actor.userType === "postulant") {
    if (payload.source !== "portal_upload") {
      throw new HttpError(400, "Source invalide pour un postulant.");
    }
    const { dossier, portalUser } = await getOwnedDossier(dossierId, actor);
    resolvedDossierId = dossier._id as Types.ObjectId;
    submittedByRole = "postulant";
    submittedById = portalUser.userId as Types.ObjectId;
  } else {
    if (payload.source === "portal_upload") {
      throw new HttpError(400, "source=portal_upload n'est pas autorisée sur l'endpoint admin.");
    }
    ensureInternalActor(actor);
    const dossier = await DossierModel.findById(ensureObjectId(dossierId, "Dossier ID")).lean();
    if (!dossier) throw new HttpError(404, "Dossier introuvable.");
    resolvedDossierId = dossier._id as Types.ObjectId;
    submittedByRole = actor.role;
    submittedById = ensureObjectId(actor.id, "Actor ID");
  }

  // ── Resolve Phase 2 ───────────────────────────────────────────────────────

  const phase = await OmaPhaseModel.findOne({
    dossierId: resolvedDossierId,
    phaseKey: "formal_request",
  });
  if (!phase) throw new HttpError(404, "Phase de demande formelle non initialisée.");

  if (phase.status === "closed") {
    throw new HttpError(409, "La phase de demande formelle est déjà clôturée.");
  }

  if (phase.formalRequestCourrierId) {
    throw new HttpError(409, "La demande formelle est déjà enregistrée pour cette phase.");
  }

  // ── Gate requirement ──────────────────────────────────────────────────────

  const gateRequirement = await DocumentRequirementModel.findOne({
    phaseKey: "formal_request",
    code: "formal_request_letter",
    requirementLevel: "gate",
    isActive: true,
  }).lean() as unknown as (GenericRecord & { _id: Types.ObjectId }) | null;

  if (!gateRequirement) {
    throw new HttpError(500, "Exigence porte (formal_request_letter) introuvable — relancez le seed.");
  }

  // ── Store file + create Document ──────────────────────────────────────────

  const physDepDate = payload.physicalDepositDate ? new Date(payload.physicalDepositDate) : undefined;

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${resolvedDossierId.toString()}/formal-request/courrier`,
    ownerType: "phase",
    ownerId: phase._id as Types.ObjectId,
    category: "courrier",
    documentType: "formal_request_letter",
    title: "Demande formelle",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: submittedById,
  });

  // ── Create Courrier ───────────────────────────────────────────────────────

  const dossierDoc = await DossierModel.findById(resolvedDossierId).select("requestId").lean() as unknown as GenericRecord | null;

  const courrier = await CourrierModel.create({
    dossierId: resolvedDossierId,
    requestId: dossierDoc?.requestId ?? undefined,
    type: "formal_request_courrier",
    source: payload.source,
    documentId,
    uploadedAt: payload.source === "portal_upload" ? new Date() : undefined,
    physicalDepositDate: physDepDate,
    officialReference: payload.officialReference,
    notes: payload.notes,
    registeredById: submittedById,
  });

  // ── Create DocumentSubmission ─────────────────────────────────────────────

  await DocumentSubmissionModel.create({
    dossierId: resolvedDossierId,
    phaseId: phase._id,
    phaseKey: "formal_request",
    requirementId: gateRequirement._id,
    documentId,
    submittedById,
    submittedByRole,
    source: payload.source,
    status: "submitted",
  });

  // ── Update OmaPhase ───────────────────────────────────────────────────────

  phase.formalRequestCourrierId = courrier._id as Types.ObjectId;
  phase.formalRequestStatus = "formal_request_received" as never;
  phase.status = "in_progress" as never;
  phase.formalRequestReceivedAt = new Date();
  await phase.save();

  // ── Audit ─────────────────────────────────────────────────────────────────

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.courrier_registered",
    entityType: "dossier",
    entityId: resolvedDossierId,
    metadata: {
      dossierId: resolvedDossierId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      courrierId: (courrier._id as Types.ObjectId).toString(),
      documentId: documentId.toString(),
      source: payload.source,
      ...(payload.officialReference ? { officialReference: payload.officialReference } : {}),
    },
  });

  // ── Return updated read state ─────────────────────────────────────────────

  if (actor.userType === "internal") {
    return getAdminFormalRequestPhase(resolvedDossierId.toString(), actor);
  }

  // Portal: return minimal safe subset
  return {
    phase: {
      id: (phase._id as Types.ObjectId).toString(),
      phaseKey: "formal_request" as const,
      status: "in_progress",
      formalRequestStatus: "formal_request_received",
      canSendToDg: true,
    },
    gate: {
      exists: true,
      formalRequestCourrierId: (courrier._id as Types.ObjectId).toString(),
      source: payload.source,
      receivedAt: new Date().toISOString(),
    },
    progress: {
      blockingMissing: false,
      completionRate: null,
    },
  };
};

// ── OMA-FORMAL-3: DG circuit helpers ─────────────────────────────────────────

const loadFormalRequestPhaseOrThrow = async (dossierId: Types.ObjectId) => {
  const phase = await OmaPhaseModel.findOne({ dossierId, phaseKey: "formal_request" });
  if (!phase) throw new HttpError(404, "Phase de demande formelle non initialisée.");
  return phase;
};

const assertPhaseNotClosed = (phase: { status: unknown }) => {
  if (phase.status === "closed") {
    throw new HttpError(409, "La phase de demande formelle est déjà clôturée.");
  }
};

const assertFormalRequestGateExists = (phase: { formalRequestCourrierId?: unknown }) => {
  if (!phase.formalRequestCourrierId) {
    throw new HttpError(409, "Le courrier de demande formelle n'a pas encore été enregistré.");
  }
};

const assertNoFormalDgReviewYet = (phase: { formalRequestDgReviewId?: unknown }) => {
  if (phase.formalRequestDgReviewId) {
    throw new HttpError(409, "La demande formelle a déjà été transmise au circuit DG.");
  }
};

const loadFormalRequestDgReviewOrThrow = async (phase: { formalRequestDgReviewId?: unknown; _id: Types.ObjectId }) => {
  if (!phase.formalRequestDgReviewId) {
    throw new HttpError(409, "Aucun circuit DG en cours pour cette phase.");
  }
  const review = await DGReviewModel.findById(phase.formalRequestDgReviewId).lean();
  if (!review) throw new HttpError(404, "Circuit DG introuvable.");
  return review;
};

// ── OMA-FORMAL-3: Send formal request to DG ───────────────────────────────────

export const sendFormalRequestToDg = async (dossierId: string, actor: Actor) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);
  assertFormalRequestGateExists(phase);
  assertNoFormalDgReviewYet(phase);

  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const { _id: dgReviewId } = await createDgReview({
    targetType: "formal_request",
    targetId: phase.formalRequestCourrierId as Types.ObjectId,
    requestId: (dossier as unknown as GenericRecord).requestId as Types.ObjectId | undefined,
    dossierId: dossierObjId,
    phaseId: phase._id as Types.ObjectId,
    handledByRole: actor.role,
    handledById: actorObjId,
    sentToDgAt: new Date(),
  });

  phase.formalRequestDgReviewId = dgReviewId as Types.ObjectId;
  phase.formalRequestStatus = "formal_sent_to_dg" as never;
  phase.status = "waiting_dg" as never;
  phase.formalSentToDgAt = new Date();
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.sent_to_dg",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      dgReviewId: dgReviewId.toString(),
      formalRequestCourrierId: (phase.formalRequestCourrierId as Types.ObjectId).toString(),
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-3: Record formal DG return scan ────────────────────────────────

export const recordFormalRequestDgReturn = async (
  dossierId: string,
  actor: Actor,
  file: Express.Multer.File | undefined,
  payload: {
    returnedFromDgAt?: string;
    officialReference?: string;
    notes?: string;
  },
) => {
  ensureInternalActor(actor);
  validateFile(file);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const review = await loadFormalRequestDgReviewOrThrow(phase);
  const reviewStatus = String((review as GenericRecord).status);
  if (reviewStatus === "decision_recorded" || reviewStatus === "cancelled") {
    throw new HttpError(409, "Ce circuit DG est déjà finalisé.");
  }

  const actorObjId = ensureObjectId(actor.id, "Actor ID");
  const returnedAt = payload.returnedFromDgAt ? new Date(payload.returnedFromDgAt) : new Date();

  const { documentId } = await recordDgReturn({
    reviewId: (review as GenericRecord)._id as Types.ObjectId,
    file: file!,
    returnedFromDgAt: returnedAt,
    uploadedById: actorObjId,
    title: "Réponse DG — Demande formelle",
    documentType: "dg_annotated_courrier",
    ownerType: "dg_review",
    ownerId: (review as GenericRecord)._id as Types.ObjectId,
    ownerPath: `dossiers/${dossierObjId.toString()}/formal-request/dg-return`,
  });

  // MVP: scanned DG return is the decision evidence — skip to decision_recorded
  // so DN can immediately schedule the formal meeting without a second step.
  phase.formalRequestStatus = "formal_dg_decision_recorded" as never;
  phase.status = "in_progress" as never;
  phase.formalDgReturnedAt = returnedAt;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.dg_return_scanned",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      dgReviewId: ((review as GenericRecord)._id as Types.ObjectId).toString(),
      formalRequestCourrierId: (phase.formalRequestCourrierId as Types.ObjectId).toString(),
      returnedScannedDocumentId: documentId.toString(),
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-3: Record formal DG decision ───────────────────────────────────

export const recordFormalRequestDgDecision = async (
  dossierId: string,
  actor: Actor,
  payload: {
    decision: "approved" | "rejected" | "reoriented" | "pending";
    orientedDirection?: string;
    observations?: string;
    decisionRecordedAt?: string;
  },
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const review = await loadFormalRequestDgReviewOrThrow(phase);
  const reviewStatus = String((review as GenericRecord).status);
  if (reviewStatus === "decision_recorded") {
    throw new HttpError(409, "Une décision DG a déjà été enregistrée pour ce circuit.");
  }
  if (reviewStatus === "cancelled") {
    throw new HttpError(409, "Ce circuit DG est annulé.");
  }

  const actorObjId = ensureObjectId(actor.id, "Actor ID");
  const decidedAt = payload.decisionRecordedAt ? new Date(payload.decisionRecordedAt) : new Date();

  await recordDgDecision({
    reviewId: (review as GenericRecord)._id as Types.ObjectId,
    decision: payload.decision,
    orientedDirection: payload.orientedDirection,
    observations: payload.observations,
    actorId: actorObjId,
    handledByRole: actor.role,
    decidedAt,
  });

  // Approved: unlock formal meeting; otherwise mark requires_correction
  const isApproved = payload.decision === "approved";
  phase.formalRequestStatus = (
    isApproved ? "formal_dg_decision_recorded" : "formal_requires_correction"
  ) as never;
  phase.status = (isApproved ? "in_progress" : "in_progress") as never;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.dg_decision_recorded",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      dgReviewId: ((review as GenericRecord)._id as Types.ObjectId).toString(),
      formalRequestCourrierId: (phase.formalRequestCourrierId as Types.ObjectId).toString(),
      decision: payload.decision,
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-4: Formal meeting helpers ─────────────────────────────────────

const assertFormalDgDecisionRecorded = (phase: { formalRequestStatus?: unknown }) => {
  // MVP: scanned DG return is the decision evidence — accept both statuses
  const status = phase.formalRequestStatus as string | undefined;
  const dgEvidenceReady =
    status === "formal_dg_decision_recorded" ||
    status === "formal_dg_returned";
  if (!dgEvidenceReady) {
    throw new HttpError(
      409,
      "Le retour DG scanné doit être enregistré avant de planifier la réunion formelle.",
    );
  }
};

const assertNoFormalMeetingYet = (phase: { formalMeetingId?: unknown }) => {
  if (phase.formalMeetingId) {
    throw new HttpError(409, "Une réunion formelle a déjà été planifiée pour cette phase.");
  }
};

const loadFormalMeetingOrThrow = async (phase: { formalMeetingId?: unknown; _id: Types.ObjectId }) => {
  if (!phase.formalMeetingId) {
    throw new HttpError(409, "Aucune réunion formelle enregistrée pour cette phase.");
  }
  const meeting = await MeetingModel.findById(phase.formalMeetingId);
  if (!meeting) throw new HttpError(404, "Réunion formelle introuvable.");
  return meeting;
};

// ── OMA-FORMAL-4: Create formal meeting ──────────────────────────────────────

export const createFormalMeeting = async (
  dossierId: string,
  actor: Actor,
  payload: {
    scheduledAt?: string;
    location?: string;
    notes?: string;
    outlookEmailStatus?: "not_required" | "to_be_sent_manually" | "sent_manually";
    outlookEmailSentAt?: string;
  },
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);
  assertFormalDgDecisionRecorded(phase);
  assertNoFormalMeetingYet(phase);

  const outlookStatus = payload.outlookEmailStatus ?? "to_be_sent_manually";

  const meeting = await MeetingModel.create({
    dossierId: dossierObjId,
    phaseId: phase._id,
    meetingType: "formal_meeting",
    title: "Réunion formelle",
    status: payload.scheduledAt ? "invited" : "planned",
    scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
    location: payload.location?.trim() || undefined,
    outlookEmailStatus: outlookStatus,
    outlookEmailSentAt: payload.outlookEmailSentAt ? new Date(payload.outlookEmailSentAt) : undefined,
    notes: payload.notes?.trim() || undefined,
    createdById: new Types.ObjectId(actor.id),
  });

  phase.formalMeetingId = meeting._id as Types.ObjectId;
  phase.formalRequestStatus = "formal_meeting_invited" as never;
  phase.status = "waiting_meeting" as never;
  await phase.save();

  // In-app notification for postulant
  const postulantUserId = (dossier as unknown as GenericRecord).postulantUserId;
  if (postulantUserId) {
    await NotificationModel.create({
      recipientUserId: postulantUserId,
      channel: "in_app",
      title: "Réunion formelle programmée",
      message: "Une réunion formelle a été programmée pour votre dossier.",
      relatedType: "meeting",
      relatedId: meeting._id,
      status: "unread",
    });
  }

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.meeting_created",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      meetingId: (meeting._id as Types.ObjectId).toString(),
      scheduledAt: payload.scheduledAt,
      outlookEmailStatus: outlookStatus,
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-4: Mark formal meeting held ────────────────────────────────────

export const markFormalMeetingHeld = async (
  dossierId: string,
  actor: Actor,
  payload: {
    heldAt?: string;
    notes?: string;
  },
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const meeting = await loadFormalMeetingOrThrow(phase);
  if (meeting.status === "cancelled") {
    throw new HttpError(409, "La réunion formelle est annulée.");
  }
  if (meeting.meetingType !== "formal_meeting") {
    throw new HttpError(409, "Type de réunion invalide.");
  }

  const heldAt = payload.heldAt ? new Date(payload.heldAt) : new Date();

  meeting.status = "held" as never;
  meeting.heldAt = heldAt;
  if (payload.notes?.trim()) {
    meeting.notes = payload.notes.trim() as never;
  }
  await meeting.save();

  phase.formalRequestStatus = "formal_meeting_held" as never;
  phase.status = "in_progress" as never;
  phase.formalMeetingHeldAt = heldAt;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.meeting_held",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      meetingId: (meeting._id as Types.ObjectId).toString(),
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-4: Upload formal meeting report ────────────────────────────────

export const uploadFormalMeetingReport = async (
  dossierId: string,
  actor: Actor,
  file: Express.Multer.File | undefined,
  payload: { notes?: string },
) => {
  ensureInternalActor(actor);
  validateFile(file);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const meeting = await loadFormalMeetingOrThrow(phase);
  if (meeting.meetingType !== "formal_meeting") {
    throw new HttpError(409, "Type de réunion invalide.");
  }

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossierObjId.toString()}/formal-request/meeting-report`,
    ownerType: "meeting",
    ownerId: meeting._id as Types.ObjectId,
    category: "meeting_report",
    documentType: "meeting_report",
    title: "Compte rendu — Réunion formelle",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

  // Phase 1 pattern: uploading the compte rendu = marking the meeting as held
  if (meeting.status !== "held") {
    meeting.status = "held" as never;
    meeting.heldAt = new Date();
  }
  meeting.reportDocumentId = documentId as never;
  if (payload.notes?.trim()) {
    meeting.notes = payload.notes.trim() as never;
  }
  await meeting.save();

  const heldAt = (meeting.heldAt as Date | undefined) ?? new Date();
  phase.formalMeetingReportDocumentId = documentId as Types.ObjectId;
  phase.formalRequestStatus = "formal_meeting_held" as never;
  phase.formalMeetingHeldAt = heldAt;
  phase.status = "in_progress" as never;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.meeting_report_uploaded",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      meetingId: (meeting._id as Types.ObjectId).toString(),
      documentId: documentId.toString(),
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-5: Supporting document uploads ─────────────────────────────────

const SUPPORTING_DOC_CATEGORY: Record<string, string> = {
  oma_approval_form: "form",
  management_personnel_acceptance: "form",
  compliance_statement: "form",
};

const mapRequirementToDocumentCategory = (reqDocType: string): string =>
  SUPPORTING_DOC_CATEGORY[reqDocType] ?? "other";

const ACTIVE_SUBMISSION_STATUS_SET = new Set([
  "submitted",
  "under_review",
  "validated",
  "requires_correction",
  "incomplete",
]);

export const uploadFormalRequestSupportingDocument = async (
  dossierId: string,
  requirementId: string,
  file: Express.Multer.File | undefined,
  payload: {
    source: "portal_upload" | "physical_deposit" | "internal_scan";
    notes?: string;
  },
  actor: Actor,
) => {
  validateFile(file);

  // ── Resolve dossier + ownership ──────────────────────────────────────────

  let resolvedDossierId: Types.ObjectId;
  let submittedByRole: string;
  let submittedById: Types.ObjectId;

  if (actor.userType === "postulant") {
    if (payload.source !== "portal_upload") {
      throw new HttpError(400, "Source invalide pour un postulant.");
    }
    const { dossier, portalUser } = await getOwnedDossier(dossierId, actor);
    resolvedDossierId = dossier._id as Types.ObjectId;
    submittedByRole = "postulant";
    submittedById = portalUser.userId as Types.ObjectId;
  } else {
    if (payload.source === "portal_upload") {
      throw new HttpError(400, "source=portal_upload n'est pas autorisée sur l'endpoint admin.");
    }
    ensureInternalActor(actor);
    const dossier = await DossierModel.findById(ensureObjectId(dossierId, "Dossier ID")).lean();
    if (!dossier) throw new HttpError(404, "Dossier introuvable.");
    resolvedDossierId = dossier._id as Types.ObjectId;
    submittedByRole = actor.role;
    submittedById = ensureObjectId(actor.id, "Actor ID");
  }

  // ── Resolve Phase 2 ───────────────────────────────────────────────────────

  const phase = await loadFormalRequestPhaseOrThrow(resolvedDossierId);
  assertPhaseNotClosed(phase);

  // ── Validate requirement ──────────────────────────────────────────────────

  const reqObjId = ensureObjectId(requirementId, "Requirement ID");
  const requirement = await DocumentRequirementModel.findById(reqObjId).lean() as unknown as GenericRecord | null;

  if (!requirement) throw new HttpError(404, "Exigence documentaire introuvable.");
  if (String(requirement.phaseKey) !== "formal_request") {
    throw new HttpError(400, "Cette exigence n'appartient pas à la phase de demande formelle.");
  }
  if (!requirement.isActive) {
    throw new HttpError(400, "Cette exigence n'est plus active.");
  }
  if (String(requirement.requirementLevel) === "gate") {
    throw new HttpError(
      409,
      "La demande formelle doit être déposée via l'action dédiée.",
    );
  }

  // ── Non-repeatable duplicate check / replacement detection ──────────────

  let submissionToReplace: GenericRecord | null = null;

  if (!requirement.isRepeatable) {
    const existingActive = (await DocumentSubmissionModel.findOne({
      phaseId: phase._id,
      requirementId: reqObjId,
      status: { $in: [...ACTIVE_SUBMISSION_STATUS_SET] },
    })
      .sort({ createdAt: -1 })
      .lean()) as unknown as GenericRecord | null;

    if (existingActive) {
      if (
        String(existingActive.status) === "requires_correction" ||
        String(existingActive.status) === "incomplete"
      ) {
        submissionToReplace = existingActive;
      } else {
        throw new HttpError(409, "Un document est déjà déposé pour cette exigence.");
      }
    }
  }

  // ── Store file + create Document ──────────────────────────────────────────

  const reqDocType = String(requirement.documentType);
  const reqLabel = String(requirement.label ?? "Document");
  const category = mapRequirementToDocumentCategory(reqDocType);

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${resolvedDossierId.toString()}/formal-request/documents/${reqDocType}`,
    ownerType: "phase",
    ownerId: phase._id as Types.ObjectId,
    category,
    documentType: "other",
    title: reqLabel,
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: submittedById,
  });

  // ── Create DocumentSubmission ─────────────────────────────────────────────

  const submission = await DocumentSubmissionModel.create({
    dossierId: resolvedDossierId,
    phaseId: phase._id,
    phaseKey: "formal_request",
    requirementId: reqObjId,
    documentId,
    submittedById,
    submittedByRole,
    source: payload.source,
    status: "submitted",
  });

  // ── Handle corrected re-upload (replacement) ─────────────────────────────

  const isReplacement = submissionToReplace !== null;
  if (isReplacement) {
    await DocumentModel.findByIdAndUpdate(submissionToReplace!.documentId, {
      status: "archived",
      replacedByDocumentId: documentId,
    });
    await DocumentSubmissionModel.findByIdAndUpdate(submissionToReplace!._id, {
      status: "replaced",
    });
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  if (isReplacement) {
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "formal_request.supporting_document_reuploaded",
      entityType: "dossier",
      entityId: resolvedDossierId,
      metadata: {
        dossierId: resolvedDossierId.toString(),
        phaseId: (phase._id as Types.ObjectId).toString(),
        requirementId: reqObjId.toString(),
        requirementCode: String(requirement.code),
        oldSubmissionId: (submissionToReplace!._id as Types.ObjectId).toString(),
        oldDocumentId: (submissionToReplace!.documentId as Types.ObjectId).toString(),
        newSubmissionId: (submission._id as Types.ObjectId).toString(),
        newDocumentId: documentId.toString(),
        source: payload.source,
      },
    });
  } else {
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "formal_request.supporting_document_uploaded",
      entityType: "dossier",
      entityId: resolvedDossierId,
      metadata: {
        dossierId: resolvedDossierId.toString(),
        phaseId: (phase._id as Types.ObjectId).toString(),
        requirementId: reqObjId.toString(),
        requirementCode: String(requirement.code),
        documentId: documentId.toString(),
        submissionId: (submission._id as Types.ObjectId).toString(),
        source: payload.source,
      },
    });
  }

  // ── Return updated read state ─────────────────────────────────────────────

  if (actor.userType === "internal") {
    return getAdminFormalRequestPhase(resolvedDossierId.toString(), actor);
  }

  return {
    uploaded: true,
    replaced: isReplacement,
    previousSubmissionId: isReplacement
      ? (submissionToReplace!._id as Types.ObjectId).toString()
      : undefined,
    documentId: documentId.toString(),
    submissionId: (submission._id as Types.ObjectId).toString(),
    requirementId: reqObjId.toString(),
    requirementCode: String(requirement.code),
    source: payload.source,
  };
};

// ── OMA-FORMAL-7: Upload recevability courrier ────────────────────────────────

export const uploadFormalRecevabilityCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: { officialReference?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  validateFile(file);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossierObjId.toString()}/formal-request/recevability`,
    ownerType: "phase",
    ownerId: phase._id as Types.ObjectId,
    category: "decision",
    documentType: "other",
    title: "Courrier de recevabilité — Phase II",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: actorObjId,
  });

  phase.recevabilityCourrierDocumentId = documentId as Types.ObjectId;

  const STATUSES_BEFORE_RECEVABILITY = new Set([
    "formal_not_started",
    "formal_waiting_request",
    "formal_request_received",
    "formal_documents_tracking",
    "formal_sent_to_dg",
    "formal_dg_returned",
    "formal_dg_decision_recorded",
    "formal_meeting_invited",
    "formal_meeting_held",
    "formal_requires_correction",
  ]);
  if (STATUSES_BEFORE_RECEVABILITY.has(String(phase.formalRequestStatus))) {
    phase.formalRequestStatus = "formal_recevability_recorded" as never;
  }
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.recevability_uploaded",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      documentId: documentId.toString(),
      actorId: actor.id,
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-7: Upload Phase II closure courrier ────────────────────────────

export const uploadFormalClosureCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: { officialReference?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  validateFile(file);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId).lean();
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossierObjId.toString()}/formal-request/closure`,
    ownerType: "phase",
    ownerId: phase._id as Types.ObjectId,
    category: "closure_letter",
    documentType: "phase_closure_letter",
    title: "Courrier de clôture — Phase II",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: actorObjId,
  });

  phase.phaseClosureCourrierDocumentId = documentId as Types.ObjectId;

  // Advance to ready_to_close if id-level gates are satisfied (full guard enforced in close endpoint)
  if (phase.formalRequestCourrierId && phase.formalRequestDgReviewId && phase.formalMeetingId) {
    phase.formalRequestStatus = "formal_ready_to_close" as never;
  }
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.closure_uploaded",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      documentId: documentId.toString(),
      actorId: actor.id,
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-7: Close Phase 2 ───────────────────────────────────────────────

export const closeFormalRequestPhase = async (
  dossierId: string,
  actor: Actor,
  payload: {
    notes?: string;
    completeness?: "complete" | "partial";
    comment?: string;
  },
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await DossierModel.findById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  // ── Full closure guards ───────────────────────────────────────────────────

  assertFormalRequestGateExists(phase);

  // Use the same DG evidence rule as canClosePhase — trust formalRequestStatus,
  // not the DGReview document's status field (which stays "returned_scanned"
  // in the collapsed DG flow and never reaches "decision_recorded").
  if (!FORMAL_DG_EVIDENCE_STATUSES.has((phase.formalRequestStatus as string | undefined) ?? "")) {
    throw new HttpError(409, "Le retour DG doit être enregistré avant de clôturer la phase.");
  }

  if (!phase.formalMeetingId) {
    throw new HttpError(409, "La réunion formelle est requise avant de clôturer la phase.");
  }
  const meeting = (await MeetingModel.findById(phase.formalMeetingId).lean()) as unknown as GenericRecord | null;
  if (!meeting) throw new HttpError(404, "Réunion formelle introuvable.");
  if (String(meeting.status) !== "held") {
    throw new HttpError(409, "La réunion formelle doit être tenue avant de clôturer la phase.");
  }

  if (!phase.formalMeetingReportDocumentId) {
    throw new HttpError(
      409,
      "Le compte rendu de réunion formelle est requis avant de clôturer la phase.",
    );
  }

  // ── Document deposit completeness ─────────────────────────────────────────

  const [closureReqs, closureSubs] = await Promise.all([
    DocumentRequirementModel.find({ phaseKey: "formal_request", isActive: true }).lean(),
    DocumentSubmissionModel.find({ dossierId: dossierObjId, phaseKey: "formal_request" }).lean(),
  ]);

  const closureRequirements = closureReqs as unknown as GenericRecord[];
  const closureSubmissions = closureSubs as unknown as GenericRecord[];

  const closureSubsByReqId = new Map<string, GenericRecord[]>();
  for (const sub of closureSubmissions) {
    const reqId = toId(sub.requirementId);
    if (!reqId) continue;
    const list = closureSubsByReqId.get(reqId) ?? [];
    list.push(sub);
    closureSubsByReqId.set(reqId, list);
  }

  const nonGateRequired = closureRequirements.filter(
    (r) => String(r.requirementLevel) !== "gate" && String(r.requirementLevel) !== "optional",
  );
  const allDeposited = nonGateRequired.every((r) => {
    const subs = closureSubsByReqId.get(r._id.toString()) ?? [];
    return computeRequirementStatus(subs) !== "missing";
  });

  if (!allDeposited) {
    throw new HttpError(
      409,
      "Toutes les pièces requises de la demande formelle doivent être déposées avant la clôture.",
    );
  }

  const closureOmaApprovalFormReq = closureRequirements.find(
    (r) => String(r.code) === "oma_approval_form",
  );
  if (closureOmaApprovalFormReq) {
    const omaSubs = closureSubsByReqId.get(closureOmaApprovalFormReq._id.toString()) ?? [];
    const omaStatus = computeRequirementStatus(omaSubs);
    if (omaStatus !== "validated") {
      throw new HttpError(
        409,
        "Le formulaire DN-AIR-R2-3-F-E-010 doit être validé avant la clôture.",
      );
    }
  }

  // ── Close Phase 2 ─────────────────────────────────────────────────────────

  const now = new Date();
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  phase.formalRequestStatus = "formal_closed" as never;
  phase.status = "closed" as never;
  phase.closedAt = now;
  phase.closedById = actorObjId;
  phase.formalClosedAt = now;
  await phase.save();

  // ── Update dossier status ─────────────────────────────────────────────────

  dossier.status = "document_evaluation_phase" as never;
  await dossier.save();

  // ── Start/unlock Phase 3 (document_evaluation) ────────────────────────────

  let docEvalPhase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "document_evaluation",
  });
  if (!docEvalPhase) {
    docEvalPhase = await OmaPhaseModel.create({
      dossierId: dossierObjId,
      phaseKey: "document_evaluation",
      status: "in_progress",
      startedAt: now,
      startedById: actorObjId,
    });
  } else if (docEvalPhase.status === "not_started") {
    docEvalPhase.status = "in_progress" as never;
    if (!docEvalPhase.startedAt) docEvalPhase.startedAt = now;
    if (!docEvalPhase.startedById) docEvalPhase.startedById = actorObjId;
    await docEvalPhase.save();
  }

  // ── Notify postulant ─────────────────────────────────────────────────────

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Phase II clôturée",
      message:
        "La phase de demande formelle est clôturée. Votre dossier passe à l'évaluation approfondie des documents.",
      relatedType: "phase",
      relatedId: phase._id,
      status: "unread",
    });
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "formal_request.phase_closed",
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: (phase._id as Types.ObjectId).toString(),
      nextPhaseId: (docEvalPhase._id as Types.ObjectId).toString(),
      actorId: actor.id,
      completeness: payload.completeness ?? "complete",
      comment: payload.comment ?? null,
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

// ── OMA-FORMAL-6: DN document review ─────────────────────────────────────────

const REVIEW_STATUSES = new Set(["validated", "rejected", "requires_correction", "incomplete"]);

export const reviewFormalRequestDocumentSubmission = async (
  submissionId: string,
  actor: Actor,
  payload: {
    status: "validated" | "rejected" | "requires_correction" | "incomplete";
    comment?: string;
  },
) => {
  ensureInternalActor(actor);

  if (!REVIEW_STATUSES.has(payload.status)) {
    throw new HttpError(400, "status doit être validated, rejected, requires_correction ou incomplete.");
  }
  if (
    (payload.status === "requires_correction" || payload.status === "incomplete") &&
    !payload.comment?.trim()
  ) {
    throw new HttpError(400, "Un commentaire est requis pour correction ou incomplet.");
  }

  // ── Load submission ───────────────────────────────────────────────────────

  const submissionObjId = ensureObjectId(submissionId, "Submission ID");
  const submission = await DocumentSubmissionModel.findById(submissionObjId);
  if (!submission) throw new HttpError(404, "Soumission introuvable.");

  if (submission.phaseKey !== "formal_request") {
    throw new HttpError(
      400,
      "Seules les soumissions de la phase de demande formelle peuvent être examinées via cet endpoint.",
    );
  }
  if (submission.status === "archived" || submission.status === "replaced") {
    throw new HttpError(409, "Cette soumission est archivée ou remplacée et ne peut plus être examinée.");
  }

  // ── Gate requirement guard ────────────────────────────────────────────────

  if (submission.requirementId) {
    const requirement = (await DocumentRequirementModel.findById(
      submission.requirementId,
    ).lean()) as unknown as GenericRecord | null;
    if (requirement && String(requirement.requirementLevel) === "gate") {
      throw new HttpError(409, "La demande formelle est traitée via le circuit courrier dédié.");
    }
    // Only the oma_approval_form requirement allows DN review decisions.
    // All other Phase 2 requirements are consultation-only.
    if (requirement && String(requirement.code) !== "oma_approval_form") {
      throw new HttpError(
        400,
        "Cette pièce est consultative et ne nécessite pas de validation.",
      );
    }
  }

  // ── Load linked document ──────────────────────────────────────────────────

  const documentObjId = submission.documentId as Types.ObjectId;
  const document = await DocumentModel.findById(documentObjId);
  if (!document) throw new HttpError(404, "Document lié introuvable.");

  // ── Load phase (not closed) ───────────────────────────────────────────────

  const phase = await OmaPhaseModel.findById(submission.phaseId);
  if (!phase) throw new HttpError(404, "Phase introuvable.");
  assertPhaseNotClosed(phase);

  // ── Load dossier (for notification) ──────────────────────────────────────

  const dossier = (await DossierModel.findById(submission.dossierId).lean()) as unknown as GenericRecord | null;
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const now = new Date();
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  // ── Mutate submission ─────────────────────────────────────────────────────

  submission.status = payload.status as never;
  submission.reviewComment = (payload.comment?.trim() || undefined) as never;
  submission.reviewedById = actorObjId as never;
  submission.reviewedAt = now as never;
  await submission.save();

  // ── Mutate document ───────────────────────────────────────────────────────

  document.status = payload.status as never;
  await document.save();

  // ── Notify postulant on correction ───────────────────────────────────────

  if (payload.status === "requires_correction") {
    const postulantUserId = dossier.postulantUserId;
    if (postulantUserId) {
      await NotificationModel.create({
        recipientUserId: postulantUserId,
        channel: "in_app",
        title: "Correction demandée",
        message: "Une correction est demandée sur un document de votre dossier.",
        relatedType: "document",
        relatedId: documentObjId,
        status: "unread",
      });
    }
  }

  // ── Audit ─────────────────────────────────────────────────────────────────

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
