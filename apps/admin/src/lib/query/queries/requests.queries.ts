import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getRequest,
  listRequests,
  openDossierDn,
  requestCorrection,
  type ListRequestsParams,
} from "@/lib/api/requests";
import { requestKeys } from "../keys/requests.keys";

type OpenDossierDnVariables = {
  id: string;
  payload?: { notes?: string };
};

type RequestCorrectionVariables = {
  id: string;
  payload: { reason: string };
};

export function useRequests(filters: ListRequestsParams = {}) {
  return useQuery({
    queryKey: requestKeys.list(filters),
    queryFn: () => listRequests(filters),
    staleTime: 30_000,
  });
}

export function useRequestDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: requestKeys.detail(id || ""),
    queryFn: () =>
      id ? getRequest(id) : Promise.reject(new Error("No ID provided")),
    enabled: Boolean(id),
  });
}

function useInvalidateRequestLists() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: requestKeys.lists(),
    });
}

export function useOpenDossierDn() {
  const invalidateLists = useInvalidateRequestLists();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: OpenDossierDnVariables) =>
      openDossierDn(id, payload || {}),
    onSuccess: (_data, variables) => {
      invalidateLists();
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(variables.id),
      });
    },
  });
}

export function useRequestCorrection() {
  const invalidateLists = useInvalidateRequestLists();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: RequestCorrectionVariables) =>
      requestCorrection(id, payload),
    onSuccess: (_data, variables) => {
      invalidateLists();
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(variables.id),
      });
    },
  });
}
