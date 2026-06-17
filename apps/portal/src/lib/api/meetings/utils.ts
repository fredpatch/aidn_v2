import { portalGet } from "../http";
import type { ListPortalMeetingsParams, PortalMeeting } from "./types";

export function listPortalMeetings(
  params: ListPortalMeetingsParams = {},
): Promise<{ items: PortalMeeting[] }> {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return portalGet(`/api/v1/portal/meetings${qs ? `?${qs}` : ""}`);
}
