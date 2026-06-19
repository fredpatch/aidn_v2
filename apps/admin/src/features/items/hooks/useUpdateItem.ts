import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api';
import type { UpdateItemInput } from '../types';

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateItemInput }) => itemsApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
