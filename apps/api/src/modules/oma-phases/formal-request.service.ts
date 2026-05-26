import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { ensureObjectId, toId, toIso } from "../../shared/utils/service.helpers.js";
import { CourrierModel } from "../courriers/courrier.model.js";
import { DocumentRequirementModel } from "../documents/document-requirement.model.js";
import { DocumentSubmissionModel } from "../documents/document-submission.model.js";
import { DossierModel } from "../dossiers/dossier.model.js";
import { OmaPhaseModel } from "./oma-phase.model.js";

type Actor = { id: string; role: string; userType: "internal" | "postulant" };
type GenericRecord = Record<string, unknown> & { _id: Types.ObjectId };

const ensureInternalActor = (actor: Actor) => {
  if (actor.userType !== "internal") {
    throw new HttpError(403, "Internal access required");
  }
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
