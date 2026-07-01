/**
 * Preliminary pre-evaluation publication slice.
 *
 * Owns publishing the active pre-evaluation template after the first meeting
 * report has been recorded.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { getActivePreEvalTemplate } from "../../document-templates/document-template.service.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import { notifyDossierPostulant } from "../helpers/notification.helpers.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor } from "../types/oma.types.js";

export const publishPreEvaluationForm = async (
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
  if (!phase || phase.preliminaryStatus !== "first_meeting_held") {
    throw new HttpError(
      409,
      "La premiere reunion doit etre tenue avant de rendre le formulaire disponible.",
    );
  }

  const { fileDocumentId } = await getActivePreEvalTemplate();

  phase.preliminaryStatus = "pre_eval_form_available";
  phase.status = "waiting_postulant";
  phase.preEvaluationTemplateDocumentId = fileDocumentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_evaluation_form_published",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_form_available",
      documentId: fileDocumentId.toString(),
    },
  });

  await notifyDossierPostulant(dossier, {
    title: "Formulaire de pre-evaluation disponible",
    message:
      "Le formulaire de pre-evaluation est disponible. Veuillez le telecharger, le completer puis le televerser dans votre dossier.",
    relatedType: "document",
    relatedId: fileDocumentId as Types.ObjectId,
  });

  return { documentId: fileDocumentId.toString() };
};
