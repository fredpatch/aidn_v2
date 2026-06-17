import type { ListRequestsFilters } from "../../api/requests";

export const requestsKeys = {
  all: ["requests"] as const,
  lists: () => [...requestsKeys.all, "list"] as const,
  list: (filters: ListRequestsFilters = {}) =>
    [...requestsKeys.lists(), filters] as const,
  details: () => [...requestsKeys.all, "detail"] as const,
  detail: (id: string) => [...requestsKeys.details(), id] as const,
};
