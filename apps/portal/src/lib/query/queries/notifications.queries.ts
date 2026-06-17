import { useQuery } from "@tanstack/react-query";

import {
  listPortalNotifications,
  type ListPortalNotificationsParams,
} from "../../api/notifications";
import { notificationsKeys } from "../keys";

export function usePortalNotifications(
  params: ListPortalNotificationsParams = {},
) {
  return useQuery({
    queryKey: notificationsKeys.list(params),
    queryFn: () => listPortalNotifications(params),
  });
}
