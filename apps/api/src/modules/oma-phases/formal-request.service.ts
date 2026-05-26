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

  // ── Action gates ──────────────────────────────────────────────────────────

  const canSendToDg = gateExists && !phase.formalRequestDgReviewId;

  const canInviteFormalMeeting =
    phase.formalRequestStatus === "formal_dg_decision_recorded";

  const canClosePhase = !!(
    phase.formalRequestCourrierId &&
    phase.formalMeetingId &&
    (phase.recevabilityCourrierDocumentId || phase.phaseClosureCourrierDocumentId)
  );

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
      })),
    };
  });

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

  phase.formalRequestStatus = "formal_dg_returned" as never;
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
  if (phase.formalRequestStatus !== "formal_dg_decision_recorded") {
    throw new HttpError(
      409,
      "La décision DG doit être approuvée et enregistrée avant de planifier la réunion formelle.",
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

  meeting.reportDocumentId = documentId as never;
  if (payload.notes?.trim()) {
    meeting.notes = payload.notes.trim() as never;
  }
  await meeting.save();

  phase.formalMeetingReportDocumentId = documentId as Types.ObjectId;
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

  // ── Non-repeatable duplicate check ────────────────────────────────────────

  if (!requirement.isRepeatable) {
    const existingActive = await DocumentSubmissionModel.findOne({
      phaseId: phase._id,
      requirementId: reqObjId,
      status: { $in: [...ACTIVE_SUBMISSION_STATUS_SET] },
    }).lean();
    if (existingActive) {
      throw new HttpError(409, "Un document est déjà déposé pour cette exigence.");
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

  // ── Audit ─────────────────────────────────────────────────────────────────

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

  // ── Return updated read state ─────────────────────────────────────────────

  if (actor.userType === "internal") {
    return getAdminFormalRequestPhase(resolvedDossierId.toString(), actor);
  }

  return {
    uploaded: true,
    documentId: documentId.toString(),
    submissionId: (submission._id as Types.ObjectId).toString(),
    requirementId: reqObjId.toString(),
    requirementCode: String(requirement.code),
    source: payload.source,
  };
};
