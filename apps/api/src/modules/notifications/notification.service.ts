import { Types } from "mongoose";

import { HttpError } from "../../shared/errors/http-error.js";
import { NotificationModel } from "./notification.model.js";

type Actor = { id: string; role: string; userType: "internal" | "postulant" };

const ensureObjectId = (id: string, label: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `${label} is invalid`);
  }
  return new Types.ObjectId(id);
};

const toIso = (value: unknown) =>
  value instanceof Date ? value.toISOString() : value ? new Date(String(value)).toISOString() : undefined;

const sanitizeNotification = (source: unknown) => {
  const n = source as Record<string, unknown> & { _id: Types.ObjectId };
  return {
    id: n._id.toString(),
    title: String(n.title ?? ""),
    message: String(n.message ?? ""),
    relatedType: String(n.relatedType ?? ""),
    relatedId: n.relatedId?.toString(),
    status: String(n.status ?? "unread"),
    createdAt: toIso(n.createdAt) ?? new Date().toISOString(),
    readAt: n.readAt ? toIso(n.readAt) : undefined,
  };
};

const ensurePortalActor = (actor: Actor) => {
  if (actor.userType !== "postulant") {
    throw new HttpError(403, "Portal access denied");
  }
};

export const listPortalNotifications = async (
  filters: { status?: string; limit?: string | number },
  actor: Actor,
) => {
  ensurePortalActor(actor);

  const recipientUserId = ensureObjectId(actor.id, "actor id");
  const rawLimit = Number(filters.limit ?? 20);
  const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? 20 : rawLimit, 50);

  const query: Record<string, unknown> = { recipientUserId };
  if (filters.status === "unread" || filters.status === "read") {
    query.status = filters.status;
  }

  const [items, unreadCount] = await Promise.all([
    NotificationModel.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
    NotificationModel.countDocuments({ recipientUserId, status: "unread" }),
  ]);

  return {
    items: items.map(sanitizeNotification),
    unreadCount,
  };
};

export const markPortalNotificationRead = async (
  notificationId: string,
  actor: Actor,
) => {
  ensurePortalActor(actor);

  const recipientUserId = ensureObjectId(actor.id, "actor id");
  const notification = await NotificationModel.findOne({
    _id: ensureObjectId(notificationId, "id"),
    recipientUserId,
  });

  if (!notification) {
    throw new HttpError(404, "Notification introuvable");
  }

  if (notification.status !== "read") {
    notification.status = "read";
    notification.readAt = new Date();
    await notification.save();
  }

  return { notification: sanitizeNotification(notification.toObject()) };
};

export const markAllPortalNotificationsRead = async (actor: Actor) => {
  ensurePortalActor(actor);

  const recipientUserId = ensureObjectId(actor.id, "actor id");
  const result = await NotificationModel.updateMany(
    { recipientUserId, status: "unread" },
    { $set: { status: "read", readAt: new Date() } },
  );

  return { updatedCount: result.modifiedCount };
};
