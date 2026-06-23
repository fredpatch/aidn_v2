/**
 * Preliminary DG flow slice.
 *
 * Owns sending the completed pre-evaluation form to DG and recording the DG
 * return scan that unlocks the preliminary meeting step.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId, parseOptionalDate } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { validatePreliminaryFile } from "../helpers/preliminary.helpers.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor } from "../types/oma.types.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";

export const sendPreEvalToDg = async (
  dossierId: string,
  input: { sentAt?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_form_submitted") {
    throw new HttpError(
      409,
      "Le formulaire de pré-évaluation doit être soumis avant l'envoi au DG.",
    );
  }

  const sentAt = parseOptionalDate(input.sentAt, "sentAt") ?? new Date();

  phase.preliminaryStatus = "pre_eval_sent_to_dg";
  phase.status = "waiting_dg";
  phase.preEvaluationSentToDgAt = sentAt;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_eval_sent_to_dg",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_sent_to_dg",
      sentAt: sentAt.toISOString(),
      notes: input.notes,
    },
  });

  return { ok: true };
};

export const recordPreEvalDgReturn = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: { returnedAt?: string; notes?: string },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossier = await DossierModel.findById(ensureObjectId(dossierId, "id"));
  if (!dossier) throw new HttpError(404, "Dossier introuvable");

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_sent_to_dg") {
    throw new HttpError(
      409,
      "Le formulaire doit être envoyé au DG avant d'enregistrer le retour.",
    );
  }

  validatePreliminaryFile(file, true, "document retourné par le DG");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/dg-return`,
    ownerType: "phase",
    ownerId: phase._id,
    category: "decision",
    documentType: "pre_evaluation_dg_return",
    title: "Document retourné par le DG - Pré-évaluation",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: new Types.ObjectId(actor.id),
  });

  const returnedAt =
    parseOptionalDate(input.returnedAt, "returnedAt") ?? new Date();

  phase.preliminaryStatus = "pre_eval_dg_decision_recorded";
  phase.status = "in_progress";
  phase.preEvaluationReturnedFromDgAt = returnedAt;
  (
    phase as unknown as Record<string, unknown>
  ).preEvaluationDgAnnotatedDocumentId = documentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_eval_dg_returned",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_dg_decision_recorded",
      documentId: documentId.toString(),
      returnedAt: returnedAt.toISOString(),
    },
  });

  return { documentId: documentId.toString() };
};
