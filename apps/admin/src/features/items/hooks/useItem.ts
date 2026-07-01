import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '../api';

export function useItem(id: string | null) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => itemsApi.get(id!),
    enabled: Boolean(id),
  });
}
