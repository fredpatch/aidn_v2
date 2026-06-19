import type { ItemsQuery } from '../types';

export function buildItemsPath(query: ItemsQuery = {}): string {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 10),
    search: query.search ?? '',
    sort: query.sorting?.[0]?.id ?? '',
    order: query.sorting?.[0]?.desc ? 'desc' : 'asc',
  });
  if (query.status) params.set('status', query.status);

  return `/items?${params.toString()}`;
}

export function buildItemPath(id: string): string {
  return `/items/${id}`;
}
