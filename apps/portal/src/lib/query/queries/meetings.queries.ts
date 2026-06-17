import { useQuery } from "@tanstack/react-query";

import {
  listPortalMeetings,
  type ListPortalMeetingsParams,
} from "../../api/meetings";
import { meetingsKeys } from "../keys";

export function usePortalMeetings(params: ListPortalMeetingsParams = {}) {
  return useQuery({
    queryKey: meetingsKeys.list(params),
    queryFn: () => listPortalMeetings(params),
  });
}
