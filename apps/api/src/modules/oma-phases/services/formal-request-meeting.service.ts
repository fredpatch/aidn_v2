/**
 * Formal request meeting slice.
 *
 * Owns Phase II formal meeting scheduling, held status, and report upload.
 * It starts only after the formal DG evidence gate and returns the shared
 * admin overview payload after mutations.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { MeetingModel } from "../../meetings/meeting.model.js";

import { ensureInternalActor } from "../helpers/access.helpers.js";
import {
  assertFormalDgDecisionRecorded,
  assertNoFormalMeetingYet,
  assertPhaseNotClosed,
  validateFormalRequestFile as validateFile,
} from "../helpers/formal-request.helpers.js";
import { notifyDossierPostulant } from "../helpers/notification.helpers.js";
import { formalRequestRepository } from "../repository/formal-request.repository.js";
import type { Actor } from "../types/oma.types.js";
import { getAdminFormalRequestPhase } from "./formal-request-overview.service.js";

const loadFormalRequestPhaseOrThrow = async (dossierId: Types.ObjectId) => {
  const phase =
    await formalRequestRepository.findFormalPhaseByDossierId(dossierId);
  if (!phase) {
    throw new HttpError(404, "Phase de demande formelle introuvable.");
  }
  return phase;
};

const loadFormalMeetingOrThrow = async (phase: {
  formalMeetingId?: unknown;
  _id: Types.ObjectId;
}) => {
  if (!phase.formalMeetingId) {
    throw new HttpError(
      409,
      "Aucune réunion formelle enregistrée pour cette phase.",
    );
  }

  const meeting = await formalRequestRepository.findMeetingById(
    phase.formalMeetingId,
  );
  if (!meeting) throw new HttpError(404, "Réunion formelle introuvable.");
  return meeting;
};

export const createFormalMeeting = async (
  dossierId: string,
  actor: Actor,
  payload: {
    scheduledAt?: string;
    location?: string;
    notes?: string;
    outlookEmailStatus?:
      | "not_required"
      | "to_be_sent_manually"
      | "sent_manually";
    outlookEmailSentAt?: string;
  },
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
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
    scheduledAt: payload.scheduledAt
      ? new Date(payload.scheduledAt)
      : undefined,
    location: payload.location?.trim() || undefined,
    outlookEmailStatus: outlookStatus,
    outlookEmailSentAt: payload.outlookEmailSentAt
      ? new Date(payload.outlookEmailSentAt)
      : undefined,
    notes: payload.notes?.trim() || undefined,
    createdById: new Types.ObjectId(actor.id),
  });

  phase.formalMeetingId = meeting._id as Types.ObjectId;
  phase.formalRequestStatus = "formal_meeting_invited" as never;
  phase.status = "waiting_meeting" as never;
  await phase.save();

  await notifyDossierPostulant(dossier, {
    title: "Réunion formelle programmée",
    message:
      "Une réunion formelle a été programmée pour votre dossier. Vous pouvez consulter les détails dans votre espace.",
    relatedType: "meeting",
    relatedId: meeting._id as Types.ObjectId,
  });

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
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
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

export const uploadFormalMeetingReport = async (
  dossierId: string,
  actor: Actor,
  file: Express.Multer.File | undefined,
  payload: { notes?: string },
) => {
  ensureInternalActor(actor);
  validateFile(file);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const dossier = await formalRequestRepository.findDossierByIdLean(dossierObjId);
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
    title: "Compte rendu - Réunion formelle",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

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
