export type PortalNotificationStatus = "unread" | "read";

export type PortalNotification = {
  id: string;
  title: string;
  message: string;
  relatedType: string;
  relatedId?: string;
  status: PortalNotificationStatus;
  createdAt: string;
  readAt?: string;
};

export type ListPortalNotificationsParams = {
  status?: "unread" | "read" | "all";
  limit?: number;
};
