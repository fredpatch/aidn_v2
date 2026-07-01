import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api';

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: itemsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
