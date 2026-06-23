/**
 * OMA phase notification helpers.
 *
 * Small side-effect helpers for creating postulant-facing notifications from
 * workflow services. Keep message selection in the calling slice so the helper
 * stays generic across OMA phases.
 */
import { Types } from "mongoose";

import { NotificationModel } from "../../notifications/notification.model.js";

export const notifyDossierPostulant = async (
  dossier: unknown,
  input: {
    title: string;
    message: string;
    relatedType: "phase" | "document" | "meeting";
    relatedId: Types.ObjectId;
  },
) => {
  const recipientUserId = (dossier as { postulantUserId?: unknown })
    .postulantUserId;
  if (!recipientUserId) return;

  await NotificationModel.create({
    recipientUserId,
    channel: "in_app",
    title: input.title,
    message: input.message,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
    status: "unread",
  });
};
