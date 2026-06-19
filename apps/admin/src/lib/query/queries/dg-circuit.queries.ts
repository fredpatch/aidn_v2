import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listDgCircuitTasks,
  markDgCircuitTaskTransmitted,
  recordDgCircuitPhysicalReceipt,
  recordDgCircuitSignedDocument,
  type DgCircuitTask,
  type DgCircuitTaskFilters,
} from "@/lib/api/dg-circuit";
import { dgCircuitKeys } from "../keys";

type DgCircuitTaskMutationVariables = {
  task: DgCircuitTask;
};

type DgCircuitTaskFormMutationVariables = DgCircuitTaskMutationVariables & {
  formData: FormData;
};

export function useDgCircuitTasks(filters: DgCircuitTaskFilters = {}) {
  return useQuery({
    queryKey: dgCircuitKeys.list(filters),
    queryFn: () => listDgCircuitTasks(filters),
  });
}

function useInvalidateDgCircuitLists() {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: dgCircuitKeys.lists(),
    });
}

export function useMarkDgCircuitTaskTransmitted() {
  const invalidateDgCircuitLists = useInvalidateDgCircuitLists();

  return useMutation({
    mutationFn: ({ task }: DgCircuitTaskMutationVariables) =>
      markDgCircuitTaskTransmitted(task),
    onSuccess: invalidateDgCircuitLists,
  });
}

export function useRecordDgCircuitSignedDocument() {
  const invalidateDgCircuitLists = useInvalidateDgCircuitLists();

  return useMutation({
    mutationFn: ({ task, formData }: DgCircuitTaskFormMutationVariables) =>
      recordDgCircuitSignedDocument(task, formData),
    onSuccess: invalidateDgCircuitLists,
  });
}

export function useRecordDgCircuitPhysicalReceipt() {
  const invalidateDgCircuitLists = useInvalidateDgCircuitLists();

  return useMutation({
    mutationFn: ({ task, formData }: DgCircuitTaskFormMutationVariables) =>
      recordDgCircuitPhysicalReceipt(task, formData),
    onSuccess: invalidateDgCircuitLists,
  });
}
