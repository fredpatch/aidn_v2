/**
 * Formal request DG circuit slice.
 *
 * Owns sending the formal request courrier to DG and recording the signed/scan
 * return or explicit DG decision. Used by admin OMA Phase II routes through the
 * OMA service barrel; it delegates generic DG review persistence to dg-circuit.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import {
  createDgReview,
  recordDgDecision,
  recordDgReturn,
} from "../../dg-circuit/dg-circuit.service.js";

import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  assertFormalRequestGateExists,
  assertNoFormalDgReviewYet,
  assertPhaseNotClosed,
  validateFormalRequestFile as validateFile,
} from "../helpers/formal-request.helpers.js";
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

const loadFormalRequestDgReviewOrThrow = async (phase: {
  formalRequestDgReviewId?: unknown;
  _id: Types.ObjectId;
}) => {
  if (!phase.formalRequestDgReviewId) {
    throw new HttpError(409, "Aucun circuit DG en cours pour cette phase.");
  }

  const review = await formalRequestRepository.findDgReviewById(
    phase.formalRequestDgReviewId,
  );
  if (!review) throw new HttpError(404, "Circuit DG introuvable.");
  return review;
};

export const sendFormalRequestToDg = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);
  assertFormalRequestGateExists(phase);
  assertNoFormalDgReviewYet(phase);

  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const { _id: dgReviewId } = await createDgReview({
    targetType: "formal_request",
    targetId: phase.formalRequestCourrierId as Types.ObjectId,
    requestId: (dossier as GenericRecord).requestId as
      | Types.ObjectId
      | undefined,
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
      formalRequestCourrierId: (
        phase.formalRequestCourrierId as Types.ObjectId
      ).toString(),
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

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
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const review = await loadFormalRequestDgReviewOrThrow(phase);
  const reviewStatus = String((review as GenericRecord).status);
  if (reviewStatus === "decision_recorded" || reviewStatus === "cancelled") {
    throw new HttpError(409, "Ce circuit DG est déjà finalisé.");
  }

  const actorObjId = ensureObjectId(actor.id, "Actor ID");
  const returnedAt = payload.returnedFromDgAt
    ? new Date(payload.returnedFromDgAt)
    : new Date();

  const { documentId } = await recordDgReturn({
    reviewId: (review as GenericRecord)._id as Types.ObjectId,
    file: file!,
    returnedFromDgAt: returnedAt,
    uploadedById: actorObjId,
    title: "Réponse DG - Demande formelle",
    documentType: "dg_annotated_courrier",
    ownerType: "dg_review",
    ownerId: (review as GenericRecord)._id as Types.ObjectId,
    ownerPath: `dossiers/${dossierObjId.toString()}/formal-request/dg-return`,
  });

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
      formalRequestCourrierId: (
        phase.formalRequestCourrierId as Types.ObjectId
      ).toString(),
      returnedScannedDocumentId: documentId.toString(),
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};

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
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase = await loadFormalRequestPhaseOrThrow(dossierObjId);
  assertPhaseNotClosed(phase);

  const review = await loadFormalRequestDgReviewOrThrow(phase);
  const reviewStatus = String((review as GenericRecord).status);
  if (reviewStatus === "decision_recorded") {
    throw new HttpError(
      409,
      "Une décision DG a déjà été enregistrée pour ce circuit.",
    );
  }
  if (reviewStatus === "cancelled") {
    throw new HttpError(409, "Ce circuit DG est annulé.");
  }

  const actorObjId = ensureObjectId(actor.id, "Actor ID");
  const decidedAt = payload.decisionRecordedAt
    ? new Date(payload.decisionRecordedAt)
    : new Date();

  await recordDgDecision({
    reviewId: (review as GenericRecord)._id as Types.ObjectId,
    decision: payload.decision,
    orientedDirection: payload.orientedDirection,
    observations: payload.observations,
    actorId: actorObjId,
    handledByRole: actor.role,
    decidedAt,
  });

  const isApproved = payload.decision === "approved";
  phase.formalRequestStatus = (
    isApproved ? "formal_dg_decision_recorded" : "formal_requires_correction"
  ) as never;
  phase.status = "in_progress" as never;
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
      formalRequestCourrierId: (
        phase.formalRequestCourrierId as Types.ObjectId
      ).toString(),
      decision: payload.decision,
    },
  });

  return getAdminFormalRequestPhase(dossierId, actor);
};
