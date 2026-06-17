import { useQuery } from "@tanstack/react-query";

import { listRequests, type ListRequestsFilters } from "../../api/requests";
import { requestsKeys } from "../keys";

export function usePortalRequests(filters: ListRequestsFilters = {}) {
  return useQuery({
    queryKey: requestsKeys.list(filters),
    queryFn: () => listRequests(filters),
  });
}
