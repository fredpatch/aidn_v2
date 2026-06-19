import type { DgCircuitTaskFilters } from "@/lib/api/dg-circuit";

export const dgCircuitKeys = {
  all: ["dg-circuit"] as const,
  lists: () => [...dgCircuitKeys.all, "list"] as const,
  list: (filters: DgCircuitTaskFilters = {}) =>
    [...dgCircuitKeys.lists(), filters] as const,
};
