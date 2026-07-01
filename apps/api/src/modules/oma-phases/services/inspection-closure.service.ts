/**
 * Inspection (Phase IV) closure slice.
 *
 * Owns Phase IV closure once the R3 avis has been recorded, and unlocks the
 * delivery phase - mirrors document-evaluation-closure.service.ts's pattern
 * for bootstrapping the next phase.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import { OmaPhaseModel } from "../models/oma-phase.model.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor } from "../types/oma.types.js";

export const closeInspectionPhase = async (dossierId: string, actor: Actor) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const dossier = await DossierModel.findById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findInspectionPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;

  if (String(phase.inspectionStatus) !== "inspection_ready_to_close") {
    throw new HttpError(
      409,
      "L'avis R3 doit etre enregistre avant de cloturer la phase d'inspection.",
    );
  }

  const now = new Date();
  phase.status = "closed" as never;
  phase.inspectionStatus = "inspection_closed" as never;
  phase.closedAt = now;
  phase.closedById = actorObjId;
  await phase.save();

  dossier.status = "delivery_phase" as never;
  await dossier.save();

  let deliveryPhase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "delivery",
  });
  if (!deliveryPhase) {
    deliveryPhase = await OmaPhaseModel.create({
      dossierId: dossierObjId,
      phaseKey: "delivery",
      status: "in_progress",
      startedAt: now,
      startedById: actorObjId,
    });
  } else if (String(deliveryPhase.status) === "not_started") {
    deliveryPhase.status = "in_progress" as never;
    if (!deliveryPhase.startedAt) deliveryPhase.startedAt = now;
    if (!deliveryPhase.startedById) deliveryPhase.startedById = actorObjId;
    await deliveryPhase.save();
  }

  const deliveryPhaseObjId = deliveryPhase._id as Types.ObjectId;

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Phase d'inspection cloturee",
      message:
        "La phase de demonstration et inspection sur site de votre dossier est cloturee. La phase de delivrance va debuter.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "inspection.phase_closed",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: phaseObjId.toString(),
      nextPhaseId: deliveryPhaseObjId.toString(),
      closedById: actor.id,
      previousStatus: String(phase.inspectionStatus),
      newStatus: "inspection_closed",
    },
  });

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "inspection" as const,
      status: "closed" as const,
      inspectionStatus: "inspection_closed" as const,
      closedAt: now.toISOString(),
    },
    nextPhase: {
      id: deliveryPhaseObjId.toString(),
      phaseKey: "delivery" as const,
      status: String(deliveryPhase.status) as "in_progress" | "not_started",
    },
    dossier: {
      id: dossierObjId.toString(),
      status: "delivery_phase" as const,
    },
  };
};
