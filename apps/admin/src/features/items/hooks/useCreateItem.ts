import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api';

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: itemsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
