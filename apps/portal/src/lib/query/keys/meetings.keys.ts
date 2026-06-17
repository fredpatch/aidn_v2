import type { ListPortalMeetingsParams } from "../../api/meetings";

export const meetingsKeys = {
  all: ["meetings"] as const,
  lists: () => [...meetingsKeys.all, "list"] as const,
  list: (params: ListPortalMeetingsParams = {}) =>
    [...meetingsKeys.lists(), params] as const,
};
