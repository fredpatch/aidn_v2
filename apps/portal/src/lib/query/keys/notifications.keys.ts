import type { ListPortalNotificationsParams } from "../../api/notifications";

export const notificationsKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationsKeys.all, "list"] as const,
  list: (params: ListPortalNotificationsParams = {}) =>
    [...notificationsKeys.lists(), params] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
};
