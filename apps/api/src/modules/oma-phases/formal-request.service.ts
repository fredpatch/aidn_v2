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
