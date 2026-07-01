/**
 * Delivery (Phase V) closure slice.
 *
 * Owns Phase V closure - but only once the certificate has actually been
 * collected by the postulant, not once payment is validated. The phase
 * deliberately stays open through the whole print -> sign -> archive ->
 * collect cycle because time-to-deliver is the KPI being tracked here, not
 * just payment turnaround. Delivery is the terminal OMA phase - this
 * closure does not bootstrap a next phase.
 */
import { Types } from "mongoose";

import { HttpError } from "../../../shared/errors/http-error.js";
import { saveDocument } from "../../../shared/utils/document.helpers.js";
import { ensureObjectId } from "../../../shared/utils/service.helpers.js";
import { writeAuditLog } from "../../audit/audit.service.js";
import { CertificateModel } from "../../certificates/certificate.model.js";
import { DossierModel } from "../../dossiers/dossier.model.js";
import { NotificationModel } from "../../notifications/notification.model.js";
import { ensureInternalActor } from "../helpers/access.helpers.js";
import { documentEvaluationRepository } from "../repository/document-evaluation.repository.js";
import type { Actor } from "../types/oma.types.js";

const CLOSURE_ELIGIBLE_CERTIFICATE_STATUSES = new Set([
  "collected",
  "archived",
]);

export const closeDeliveryPhase = async (
  dossierId: string,
  file: Express.Multer.File | undefined,
  actor: Actor,
) => {
  ensureInternalActor(actor);

  const dossierObjId = ensureObjectId(dossierId, "Dossier ID");
  const actorObjId = ensureObjectId(actor.id, "Actor ID");

  const dossier = await DossierModel.findById(dossierObjId);
  if (!dossier) throw new HttpError(404, "Dossier introuvable.");

  const phase =
    await documentEvaluationRepository.findDeliveryPhaseByDossierIdLean(
      dossierObjId,
    );
  const phaseObjId = phase._id as Types.ObjectId;

  const certificate = await CertificateModel.findOne({ dossierId: dossierObjId });
  if (
    !certificate ||
    !CLOSURE_ELIGIBLE_CERTIFICATE_STATUSES.has(String(certificate.status))
  ) {
    throw new HttpError(
      409,
      "Le certificat doit avoir ete retire par le postulant avant de cloturer la phase V.",
    );
  }

  const now = new Date();

  if (file) {
    const closureDocumentId = await saveDocument({
      file,
      ownerPath: `dossiers/${dossierId}/delivery`,
      ownerType: "phase",
      ownerId: phaseObjId,
      category: "closure_letter",
      documentType: "delivery_closure_letter",
      title: `Lettre de cloture Phase V - ${String(dossier.dossierNumber)}`,
      visibility: "postulant_visible",
      status: "uploaded",
      uploadedById: actorObjId,
    });
    phase.deliveryClosureCourrierDocumentId =
      closureDocumentId as unknown as typeof phase.deliveryClosureCourrierDocumentId;
  }

  phase.status = "closed" as never;
  phase.deliveryStatus = "delivery_closed" as never;
  phase.closedAt = now;
  phase.closedById = actorObjId;
  await phase.save();

  dossier.status = "closed" as never;
  dossier.closedAt = now as unknown as typeof dossier.closedAt;
  await dossier.save();

  if (dossier.postulantUserId) {
    await NotificationModel.create({
      recipientUserId: dossier.postulantUserId,
      channel: "in_app",
      title: "Dossier cloture",
      message:
        "Votre dossier est desormais cloture. Merci pour votre demarche aupres de l'ANAC.",
      relatedType: "phase",
      relatedId: phaseObjId,
      status: "unread",
    });
  }

  await writeAuditLog({
    action: "delivery.phase_closed",
    actorId: actor.id,
    actorRole: actor.role,
    entityType: "dossier",
    entityId: dossierObjId,
    metadata: {
      dossierId: dossierObjId.toString(),
      phaseId: phaseObjId.toString(),
      certificateId: (certificate._id as Types.ObjectId).toString(),
      closedById: actor.id,
    },
  });

  return {
    phase: {
      id: phaseObjId.toString(),
      phaseKey: "delivery" as const,
      status: "closed" as const,
      deliveryStatus: "delivery_closed" as const,
      closedAt: now.toISOString(),
    },
    dossier: {
      id: dossierObjId.toString(),
      status: "closed" as const,
    },
    certificateId: (certificate._id as Types.ObjectId).toString(),
  };
};
