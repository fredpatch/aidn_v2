import { useQuery } from '@tanstack/react-query';
import { itemsApi } from '../api/items.api';
import type { SortingState } from '@/components/data-table';
import type { ItemStatus } from '../types';

interface UseItemsListParams {
  page: number;
  pageSize: number;
  search: string;
  sorting: SortingState;
  status?: ItemStatus;
}

export function useItemsList({ page, pageSize, search, sorting, status }: UseItemsListParams) {
  return useQuery({
    queryKey: ['items', { page, pageSize, search, sorting, status }],
    queryFn: () => itemsApi.list({ page, pageSize, search, sorting, status }),
  });
}
