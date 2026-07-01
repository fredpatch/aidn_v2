/**
 * Inspection (Phase IV) R3 avis slice.
 *
 * Owns recording the R3 process's compliance opinion (avis) on the postulant,
 * which is the trigger event described in the cahier des charges ("Le
 * processus R3 partage son avis au DN sur le niveau de conformite de P").
 * Does not own payment (inspection-payment.service.ts) or closure
 * (inspection-closure.service.ts).
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor, GenericRecord } from "../types/oma.types.js";

export const recordR3Avis = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  input: {
    decision: "conforme" | "non_conforme";
    observations?: string;
  },
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");
  const dossier =
    await documentEvaluationRepository.findDossierById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findInspectionPhaseByDossierIdLean(
      dossierObjId,
    );

  if (String(phase.inspectionStatus) !== "inspection_awaiting_r3_avis") {
    throw new HttpError(
      409,
      "L'avis R3 ne peut etre enregistre qu'apres validation du paiement des frais d'audit.",
    );
  }

  const phaseObjId = phase._id as Types.ObjectId;
  const now = new Date();
  const observations = input.observations?.trim() || undefined;

  let avisDocumentId: Types.ObjectId | undefined;
  if (file) {
    const title = `Avis R3 - ${String(
      (dossier as unknown as GenericRecord).dossierNumber,
    )}`;
    avisDocumentId = await saveDocument({
      file,
      ownerPath: `dossiers/${dossierId}/inspection`,
      ownerType: "phase",
      ownerId: phaseObjId,
      category: "decision",
      documentType: "r3_avis_report",
      title,
      visibility: "internal_only",
      status: "uploaded",
      uploadedById: actorObjId,
    });
  }

  phase.r3AvisDecision = input.decision as never;
  phase.r3AvisObservations =
    (observations ?? null) as unknown as typeof phase.r3AvisObservations;
  phase.r3AvisDocumentId = (avisDocumentId ??
    null) as unknown as typeof phase.r3AvisDocumentId;
  phase.r3AvisRecordedAt = now as unknown as typeof phase.r3AvisRecordedAt;
  phase.r3AvisRecordedById =
    actorObjId as unknown as typeof phase.r3AvisRecordedById;
  phase.inspectionStatus = "inspection_ready_to_close" as never;
  await phase.save();

  // The cahier des charges frames this specifically as R3 notifying DN of
  // the avis - this notification is the deliverable of this action, not an
  // incidental side effect.
  const dossierRecord = dossier as unknown as GenericRecord;
  if (dossierRecord.assignedDnAgentId) {
    await NotificationModel.create({
      recipientUserId: dossierRecord.assignedDnAgentId,
      channel: "in_app",
      title: "Avis R3 disponible",
      message: `Le processus R3 a transmis son avis (${
        input.decision === "conforme" ? "conforme" : "non conforme"
      }) pour le dossier n ${String(dossierRecord.dossierNumber)}.`,
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "inspection.r3_avis_recorded",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "phase",
    entityId: phaseObjId.toString(),
    metadata: {
      dossierId,
      decision: input.decision,
      hasDocument: Boolean(avisDocumentId),
      hasObservations: Boolean(observations),
    },
  });

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "inspection" as const,
      status: String(phase.status),
      inspectionStatus: String(phase.inspectionStatus),
      r3Avis: {
        decision: input.decision,
        observations: observations ?? null,
        documentId: avisDocumentId?.toString() ?? null,
        recordedAt: now.toISOString(),
      },
    },
  };
};
