/**
 * Preliminary meeting workflow slice.
 *
 * Owns first-contact and preliminary meeting scheduling/recording, including
 * meeting report uploads and postulant notifications.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { MeetingModel } from "../../meetings/meeting.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import { notifyDossierPostulant } from "../helpers/notification.helpers.js";
import { sanitizeMeeting } from "../helpers/oma-phase.formatters.js";
import { validatePreliminaryFile } from "../helpers/preliminary.helpers.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";

const getOrCreatePreliminaryPhase = async (
  dossierId: Types.ObjectId,
  actor: Actor,
) => {
  let phase = await OmaPhaseModel.findOne({
    dossierId,
    phaseKey: "preliminary",
  });
  if (!phase) {
    phase = await OmaPhaseModel.create({
      dossierId,
      phaseKey: "preliminary",
      status: "in_progress",
      preliminaryStatus: "preliminary_started",
      startedAt: new Date(),
      startedById: new Types.ObjectId(actor.id),
    });
  } else if (!phase.preliminaryStatus) {
    phase.preliminaryStatus = "preliminary_started";
    await phase.save();
  }
  return phase;
};

export const inviteFirstMeeting = async (
  dossierId: string,
  input: { scheduledAt?: string; location?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await getOrCreatePreliminaryPhase(dossier._id, actor);

  if (phase.preliminaryStatus !== "preliminary_started") {
    throw new HttpError(
      409,
      "La premiere reunion ne peut etre planifiee qu'au debut de la phase preliminaire.",
    );
  }

  const meeting = await MeetingModel.create({
    dossierId: dossier._id,
    phaseId: phase._id,
    meetingType: "first_contact_meeting",
    title: "Premiere reunion de contact",
    status: "invited",
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    location: input.location?.trim() || undefined,
    outlookEmailStatus: "to_be_sent_manually",
    notes: input.notes?.trim() || undefined,
    createdById: new Types.ObjectId(actor.id),
  });

  phase.preliminaryStatus = "first_meeting_invited";
  phase.status = "waiting_meeting";
  phase.firstMeetingId = meeting._id;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.first_meeting_invited",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "first_meeting_invited",
      meetingId: meeting._id.toString(),
    },
  });

  await notifyDossierPostulant(dossier, {
    title: "Rendez-vous programme",
    message:
      "Un rendez-vous a ete programme pour votre dossier. Vous pouvez consulter les details dans votre espace.",
    relatedType: "meeting",
    relatedId: meeting._id as Types.ObjectId,
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};

export const recordFirstMeeting = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { notes?: string; visibleToPostulant?: boolean },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "first_meeting_invited") {
    throw new HttpError(
      409,
      "La premiere reunion n'a pas encore ete planifiee.",
    );
  }

  if (!phase.firstMeetingId) {
    throw new HttpError(409, "Aucune reunion initiale enregistree.");
  }

  const meeting = await MeetingModel.findById(phase.firstMeetingId);
  if (!meeting) throw new HttpError(404, "Reunion introuvable");

  validatePreliminaryFile(file, true, "compte rendu");

  const reportDocumentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/first-meeting-report`,
    ownerType: "meeting",
    ownerId: meeting._id,
    category: "meeting_report",
    documentType: "meeting_report",
    title: "Compte rendu - Premiere reunion",
    visibility: input.visibleToPostulant
      ? "postulant_visible"
      : "internal_only",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

  meeting.status = "held";
  meeting.heldAt = new Date();
  if (input.notes?.trim()) meeting.notes = input.notes.trim();
  meeting.reportDocumentId = reportDocumentId;
  await meeting.save();

  phase.preliminaryStatus = "first_meeting_held";
  phase.status = "in_progress";
  phase.firstMeetingReportDocumentId = reportDocumentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.first_meeting_recorded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "first_meeting_held",
      hasReport: Boolean(reportDocumentId),
    },
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};

export const invitePreliminaryMeeting = async (
  dossierId: string,
  input: { scheduledAt?: string; location?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_dg_decision_recorded") {
    throw new HttpError(
      409,
      "La decision DG doit etre enregistree avant de planifier la reunion preliminaire.",
    );
  }

  const meeting = await MeetingModel.create({
    dossierId: dossier._id,
    phaseId: phase._id,
    meetingType: "preliminary_meeting",
    title: "Reunion preliminaire",
    status: "invited",
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    location: input.location?.trim() || undefined,
    outlookEmailStatus: "to_be_sent_manually",
    notes: input.notes?.trim() || undefined,
    createdById: new Types.ObjectId(actor.id),
  });

  phase.preliminaryStatus = "preliminary_meeting_invited";
  phase.status = "waiting_meeting";
  phase.preliminaryMeetingId = meeting._id;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.preliminary_meeting_invited",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_meeting_invited",
      meetingId: meeting._id.toString(),
    },
  });

  await notifyDossierPostulant(dossier, {
    title: "Reunion preliminaire programmee",
    message:
      "Une reunion preliminaire a ete programmee pour votre dossier. Vous pouvez consulter les details dans votre espace.",
    relatedType: "meeting",
    relatedId: meeting._id as Types.ObjectId,
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};

export const recordPreliminaryMeeting = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "preliminary_meeting_invited") {
    throw new HttpError(
      409,
      "La reunion preliminaire n'a pas encore ete planifiee.",
    );
  }

  if (!phase.preliminaryMeetingId) {
    throw new HttpError(409, "Aucune reunion preliminaire enregistree.");
  }

  const meeting = await MeetingModel.findById(phase.preliminaryMeetingId);
  if (!meeting) throw new HttpError(404, "Reunion introuvable");

  validatePreliminaryFile(file, true, "compte rendu");

  const reportDocumentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/preliminary-meeting-report`,
    ownerType: "meeting",
    ownerId: meeting._id,
    category: "meeting_report",
    documentType: "meeting_report",
    title: "Compte rendu - Reunion preliminaire",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

  meeting.status = "held";
  meeting.heldAt = new Date();
  if (input.notes?.trim()) meeting.notes = input.notes.trim();
  meeting.reportDocumentId = reportDocumentId;
  await meeting.save();

  phase.preliminaryStatus = "preliminary_meeting_held";
  phase.status = "in_progress";
  phase.preliminaryMeetingReportDocumentId = reportDocumentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.preliminary_meeting_recorded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_meeting_held",
      hasReport: Boolean(reportDocumentId),
    },
  });

  return {
    meeting: sanitizeMeeting(meeting.toObject() as unknown as GenericRecord),
  };
};
