import { portalGet, portalPost } from "../http";
import type {
  ListPortalNotificationsParams,
  PortalNotification,
} from "./types";

export function listPortalNotifications(
  params: ListPortalNotificationsParams = {},
): Promise<{ items: PortalNotification[]; unreadCount: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return portalGet(`/api/v1/portal/notifications${qs ? `?${qs}` : ""}`);
}

export function markPortalNotificationRead(
  id: string,
): Promise<{ notification: PortalNotification }> {
  return portalPost(`/api/v1/portal/notifications/${id}/read`, {});
}

export function markAllPortalNotificationsRead(): Promise<{
  updatedCount: number;
}> {
  return portalPost("/api/v1/portal/notifications/read-all", {});
}
