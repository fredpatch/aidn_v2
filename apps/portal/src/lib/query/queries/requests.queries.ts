import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRequest,
  listRequests,
  type CreateRequestPayload,
  type ListRequestsFilters,
} from "../../api/requests";
import { requestsKeys } from "../keys";

export function usePortalRequests(filters: ListRequestsFilters = {}) {
  return useQuery({
    queryKey: requestsKeys.list(filters),
    queryFn: () => listRequests(filters),
  });
}

export function useCreatePortalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => createRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestsKeys.lists() });
    },
  });
}
