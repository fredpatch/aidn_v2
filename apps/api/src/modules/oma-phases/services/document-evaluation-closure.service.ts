/**
 * Document evaluation closure slice.
 *
 * Owns Phase III closure once every evaluation is satisfactory and unlocks the
 * inspection phase.
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

export const closeDocumentEvaluationPhase = async (
  dossierId: string,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const dossier = await DossierModel.findById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findDocEvalPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;
  const evaluationCounts =
    await documentEvaluationRepository.countDocumentEvaluationsByStatus(
      phaseObjId,
    );

  const byStatus = evaluationCounts;
  const totalEvals = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const blocking =
    totalEvals === 0 ||
    (byStatus["pending"] ?? 0) > 0 ||
    (byStatus["non_satisfaisant"] ?? 0) > 0 ||
    (byStatus["correction_submitted"] ?? 0) > 0;

  if (blocking) {
    throw new HttpError(
      409,
      "Toutes les evaluations de documents doivent etre satisfaisantes avant de cloturer la phase d'evaluation.",
    );
  }

  const now = new Date();
  phase.status = "closed" as never;
  phase.documentEvaluationStatus = "document_evaluation_closed" as never;
  phase.closedAt = now;
  phase.closedById = actorObjId;
  await phase.save();

  dossier.status = "inspection_phase" as never;
  await dossier.save();

  let inspectionPhase = await OmaPhaseModel.findOne({
    dossierId: dossierObjId,
    phaseKey: "inspection",
  });
  if (!inspectionPhase) {
    inspectionPhase = await OmaPhaseModel.create({
      dossierId: dossierObjId,
      phaseKey: "inspection",
      status: "in_progress",
      startedAt: now,
      startedById: actorObjId,
    });
  } else if (String(inspectionPhase.status) === "not_started") {
    inspectionPhase.status = "in_progress" as never;
    if (!inspectionPhase.startedAt) inspectionPhase.startedAt = now;
    if (!inspectionPhase.startedById) inspectionPhase.startedById = actorObjId;
    await inspectionPhase.save();
  }

  const inspectionPhaseObjId = inspectionPhase._id as Types.ObjectId;

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Phase d'evaluation approfondie cloturee",
      message:
        "La phase d'evaluation approfondie des documents de votre dossier est cloturee. La phase d'inspection va debuter.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "document_evaluation.phase_closed",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: phaseObjId.toString(),
      nextPhaseId: inspectionPhaseObjId.toString(),
      closedById: actor.id,
      previousStatus: String(phase.documentEvaluationStatus),
      newStatus: "document_evaluation_closed",
    },
  });

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "document_evaluation" as const,
      status: "closed" as const,
      documentEvaluationStatus: "document_evaluation_closed" as const,
      closedAt: now.toISOString(),
    },
    nextPhase: {
      id: inspectionPhaseObjId.toString(),
      phaseKey: "inspection" as const,
      status: String(inspectionPhase.status) as "in_progress" | "not_started",
    },
    dossier: {
      id: dossierObjId.toString(),
      status: "inspection_phase" as const,
    },
  };
};
