/**
 * OMA phase portal pre-evaluation upload slice.
 *
 * Owns the postulant upload of the completed pre-evaluation form and the
 * transition from form available to submitted.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { validatePreliminaryFile } from "../helpers/preliminary.helpers.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import type { Actor } from "../types/oma.types.js";
import { getOwnedDossier } from "./oma-phase-access.service.js";

export const uploadCompletedPreEvaluationForm = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  actor: Actor,
) => {
  const { dossier, portalUser } = await getOwnedDossier(dossierId, actor);

  const phase = await OmaPhaseModel.findOne({
    dossierId: dossier._id,
    phaseKey: "preliminary",
  });
  if (!phase || phase.preliminaryStatus !== "pre_eval_form_available") {
    throw new HttpError(
      409,
      "Le formulaire de pre-evaluation n'est pas disponible ou a deja ete soumis.",
    );
  }

  validatePreliminaryFile(file, true, "formulaire de pre-evaluation complete");

  const documentId = await saveDocument({
    file: file!,
    ownerPath: `dossiers/${dossier._id.toString()}/preliminary/completed-pre-evaluation-form`,
    ownerType: "phase",
    ownerId: phase._id,
    category: "form",
    documentType: "pre_evaluation_completed_form",
    title: "Formulaire de pre-evaluation complete",
    visibility: "internal_only",
    status: "uploaded",
    uploadedById: portalUser.userId as Types.ObjectId,
  });

  phase.preliminaryStatus = "pre_eval_form_submitted";
  phase.status = "in_progress";
  phase.completedPreEvaluationDocumentId = documentId;
  await phase.save();

  await writeAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    action: "oma.preliminary.pre_evaluation_form_uploaded",
    entityType: "dossier",
    entityId: dossier._id,
    after: {
      preliminaryStatus: "pre_eval_form_submitted",
      documentId: documentId.toString(),
    },
  });

  return { ok: true };
};
