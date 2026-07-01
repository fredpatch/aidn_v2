/**
 * Formal request closure slice.
 *
 * Owns recevability courrier upload, closure courrier upload, and the final
 * Phase II close operation that unlocks document evaluation. It enforces the
 * DG evidence, meeting/report, document completeness, and OMA form validation
 * gates before moving the dossier to Phase III.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId, toId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DossierModel } from "../../dossiers/dossier.model.js";

import { FORMAL_DG_EVIDENCE_STATUSES } from "../constants/formal-request.constants.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  assertFormalRequestGateExists,
  assertPhaseNotClosed,
  computeRequirementStatus,
  validateFormalRequestFile as validateFile,
} from "../helpers/formal-request.helpers.js";
import { notifyDossierPostulant } from "../helpers/notification.helpers.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import { formalRequestRepository } from "../repository/formal-request.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";
import { getAdminFormalRequestPhase } from "./formal-request-overview.service.js";

const loadFormalRequestPhaseOrThrow = async (dossierId: Types.ObjectId) => {
  const phase =
    await formalRequestRepository.findFormalPhaseByDossierId(dossierId);
  if (!phase) {
    throw new HttpError(404, "Phase de demande formelle non initialisée.");
  }
  return phase;
};

export const uploadFormalRecevabilityCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: { officialReference?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  validateFile(file);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
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
    title: "Courrier de recevabilité - Phase II",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: actorObjId,
  });

  phase.recevabilityCourrierDocumentId = documentId as Types.ObjectId;

  const statusesBeforeRecevability = new Set([
    "formal_not_started",
    "formal_waiting_request",
    "formal_request_received",
    "formal_sent_to_dg",
    "formal_dg_returned",
    "formal_dg_decision_recorded",
    "formal_meeting_invited",
    "formal_meeting_held",
    "formal_requires_correction",
  ]);
  if (statusesBeforeRecevability.has(String(phase.formalRequestStatus))) {
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

export const uploadFormalClosureCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  payload: { officialReference?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);
  validateFile(file);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
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
    title: "Courrier de clôture - Phase II",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: actorObjId,
  });

  phase.phaseClosureCourrierDocumentId = documentId as Types.ObjectId;

  if (
    phase.formalRequestCourrierId &&
    phase.formalRequestDgReviewId &&
    phase.formalMeetingId
  ) {
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
  assertFormalRequestGateExists(phase);

  if (
    !FORMAL_DG_EVIDENCE_STATUSES.has(
      (phase.formalRequestStatus as string | undefined) ?? "",
    )
  ) {
    throw new HttpError(
      409,
      "Le retour DG doit être enregistré avant de clôturer la phase.",
    );
  }

  if (!phase.formalMeetingId) {
    throw new HttpError(
      409,
      "La réunion formelle est requise avant de clôturer la phase.",
    );
  }

  const meeting = await formalRequestRepository.findMeetingByIdLean(
    phase.formalMeetingId,
  );
  if (!meeting) throw new HttpError(404, "Réunion formelle introuvable.");
  if (String(meeting.status) !== "held") {
    throw new HttpError(
      409,
      "La réunion formelle doit être tenue avant de clôturer la phase.",
    );
  }

  if (!phase.formalMeetingReportDocumentId) {
    throw new HttpError(
      409,
      "Le compte rendu de réunion formelle est requis avant de clôturer la phase.",
    );
  }

  const [closureRequirements, closureSubmissions] = await Promise.all([
    formalRequestRepository.findFormalRequirements(),
    formalRequestRepository.findFormalSubmissionsByDossierId(dossierObjId),
  ]);

  const closureSubsByReqId = new Map<string, GenericRecord[]>();
  for (const sub of closureSubmissions) {
    const reqId = toId(sub.requirementId);
    if (!reqId) continue;
    const list = closureSubsByReqId.get(reqId) ?? [];
    list.push(sub);
    closureSubsByReqId.set(reqId, list);
  }

  const nonGateRequired = closureRequirements.filter(
    (r) =>
      String(r.requirementLevel) !== "gate" &&
      String(r.requirementLevel) !== "optional" &&
      String(r.requirementLevel) !== "conditional",
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
    const omaSubs =
      closureSubsByReqId.get(closureOmaApprovalFormReq._id.toString()) ?? [];
    const omaStatus = computeRequirementStatus(omaSubs);
    if (omaStatus !== "validated") {
      throw new HttpError(
        409,
        "Le formulaire DN-AIR-R2-3-F-E-010 doit être validé avant la clôture.",
      );
    }
  }

  const now = new Date();
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  phase.formalRequestStatus = "formal_closed" as never;
  phase.status = "closed" as never;
  phase.closedAt = now;
  phase.closedById = actorObjId;
  phase.formalClosedAt = now;
  await phase.save();

  dossier.status = "document_evaluation_phase" as never;
  await dossier.save();

  let docEvalPhase =
    await formalRequestRepository.findDocumentEvaluationPhaseByDossierId(
      dossierObjId,
    );
  if (!docEvalPhase) {
    docEvalPhase = await OmaPhaseModel.create({
      dossierId: dossierObjId,
      phaseKey: "document_evaluation",
      status: "in_progress",
      documentEvaluationStatus: "document_evaluation_waiting_invoice",
      startedAt: now,
      startedById: actorObjId,
    });
  } else if (docEvalPhase.status === "not_started") {
    docEvalPhase.status = "in_progress" as never;
    docEvalPhase.documentEvaluationStatus = "document_evaluation_waiting_invoice" as never;
    if (!docEvalPhase.startedAt) docEvalPhase.startedAt = now;
    if (!docEvalPhase.startedById) docEvalPhase.startedById = actorObjId;
    await docEvalPhase.save();
  }

  await notifyDossierPostulant(dossier, {
    title: "Phase de demande formelle clôturée",
    message: "La phase de demande formelle de votre dossier est clôturée.",
    relatedType: "phase",
    relatedId: phase._id as Types.ObjectId,
  });

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
