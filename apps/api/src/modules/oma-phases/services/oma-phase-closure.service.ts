/**
 * Preliminary closure workflow slice.
 *
 * Owns preliminary closure courrier upload and final Phase I close, including
 * creation/unlock of the formal request phase.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import { notifyDossierPostulant } from "../helpers/notification.helpers.js";
import { validatePreliminaryFile } from "../helpers/preliminary.helpers.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor } from "../types/oma.types.js";

export const uploadClosureCourrier = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { title?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "preliminary_meeting_held") {
    throw new HttpError(
      409,
      "La reunion preliminaire doit etre tenue avant de televerser le courrier de cloture.",
    );
  }

  validatePreliminaryFile(file, true, "courrier de cloture");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/closure-courrier`,
    ownerType: "phase",
    ownerId: phase._id,
    category: "closure_letter",
    documentType: "phase_closure_letter",
    title: input.title?.trim() || "Courrier de cloture - Phase preliminaire",
    visibility: "postulant_visible",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

  phase.preliminaryStatus = "preliminary_ready_to_close";
  phase.status = "ready_to_close";
  phase.closureCourrierDocumentId = documentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.closure_courrier_uploaded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_ready_to_close",
      documentId: documentId.toString(),
    },
  });

  return { documentId: documentId.toString() };
};

export const closePreliminaryPhase = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  const closableStatuses = [
    "preliminary_meeting_held",
    "preliminary_ready_to_close",
  ];
  if (!phase || !closableStatuses.includes(phase.preliminaryStatus ?? "")) {
    throw new HttpError(
      409,
      "La reunion preliminaire doit etre tenue avant de cloturer la phase.",
    );
  }

  const now = new Date();
  phase.preliminaryStatus = "preliminary_closed";
  phase.status = "closed";
  phase.closedAt = now;
  phase.closedById = new Types.ObjectId(actor.id);
  await phase.save();

  dossier.status = "formal_request_phase";
  await dossier.save();

  await OmaPhaseModel.updateOne(
    { dossierId: dossier._id, phaseKey: "formal_request" },
    {
      $set: { status: "not_started" },
      $unset: { startedAt: "", startedById: "" },
    },
    { upsert: true },
  );

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.closed",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "preliminary_closed",
      dossierId: dossier._id.toString(),
    },
  });

  await notifyDossierPostulant(dossier, {
    title: "Phase preliminaire cloturee",
    message: "La phase preliminaire de votre dossier est cloturee.",
    relatedType: "phase",
    relatedId: phase._id as Types.ObjectId,
  });

  return { ok: true };
};
