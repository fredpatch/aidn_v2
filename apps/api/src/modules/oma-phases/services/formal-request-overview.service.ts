/**
 * Formal request overview slice.
 *
 * Owns the read-only admin Phase II view model: dossier, formal phase,
 * requirements, submissions, DG evidence, courrier, meeting, and close gates.
 * Mutation slices call this after writes to return a consistent response.
 */
import { HttpError } from "../../../shared/errors/http-error.js";
import { ensureObjectId, toId, toIso } from "../../../shared/utils/service.helpers.js";

import { FORMAL_DG_EVIDENCE_STATUSES } from "../constants/formal-request.constants.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import { computeRequirementStatus } from "../helpers/formal-request.helpers.js";
import { formalRequestRepository } from "../repository/formal-request.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";

export const getAdminFormalRequestPhase = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");

  const dossier = await formalRequestRepository.findDossierByIdLean(
    dossierObjId,
  );
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await formalRequestRepository.findFormalPhaseByDossierIdLean(
    dossierObjId,
  );

  if (!phase)
    throw new HttpError(404, "Phase de demande formelle non initialisée.");

  // ── Requirements ──────────────────────────────────────────────────────────

  const [requirements, submissions] = await Promise.all([
    formalRequestRepository.findFormalRequirements(),
    formalRequestRepository.findFormalSubmissionsByDossierId(dossierObjId),
  ]);

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
    gateCourrier = await formalRequestRepository.findCourrierById(
      phase.formalRequestCourrierId,
    );
  }

  // ── Meeting ───────────────────────────────────────────────────────────────

  let formalMeeting: GenericRecord | null = null;
  if (phase.formalMeetingId) {
    formalMeeting = await formalRequestRepository.findMeetingByIdLean(
      phase.formalMeetingId,
    );
  }

  // ── DG Review ─────────────────────────────────────────────────────────────

  let formalDgReview: GenericRecord | null = null;
  if (phase.formalRequestDgReviewId) {
    formalDgReview = await formalRequestRepository.findDgReviewById(
      phase.formalRequestDgReviewId,
    );
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
  const meetingHeld = formalMeeting
    ? String(formalMeeting.status) === "held"
    : false;
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
    (r) =>
      r.requirementLevel !== "gate" &&
      r.requirementLevel !== "optional" &&
      r.requirementLevel !== "conditional",
  );
  const allRequiredDeposited = nonGateRequiredReqs.every(
    (r) => r.status !== "missing",
  );
  const omaFormValidated =
    requirementList.find((r) => r.code === "oma_approval_form")?.status ===
    "validated";

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
  const submitted = requirementList.filter(
    (r) => r.submissions.length > 0,
  ).length;
  const validated = requirementList.filter(
    (r) => r.status === "validated",
  ).length;
  const missing = requirementList.filter(
    (r) =>
      r.submissions.length === 0 &&
      r.requirementLevel !== "gate" &&
      r.requirementLevel !== "optional" &&
      r.requirementLevel !== "conditional",
  ).length;
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
          location: formalMeeting.location
            ? String(formalMeeting.location)
            : undefined,
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
      recevabilityCourrierDocumentId: toId(
        phase.recevabilityCourrierDocumentId,
      ),
      phaseClosureCourrierDocumentId: toId(
        phase.phaseClosureCourrierDocumentId,
      ),
      canClosePhase,
    },
  };
};

// ── OMA-FORMAL-2: Register formal request courrier ────────────────────────────

