import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api/client';
import { isMockMode } from '../../../lib/data/data-mode';
import { mockCreateItem, mockDeleteItem, mockGetItem, mockListItems, mockUpdateItem } from '../mocks/items.mock';
import type { CreateItemInput, Item, ItemsQuery, PaginatedItems, UpdateItemInput } from '../types';

export const itemsApi = {
  list: (query: ItemsQuery = {}): Promise<PaginatedItems> => {
    if (isMockMode()) return mockListItems(query);
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      pageSize: String(query.pageSize ?? 10),
      search: query.search ?? '',
      sort: query.sorting?.[0]?.id ?? '',
      order: query.sorting?.[0]?.desc ? 'desc' : 'asc',
    });
    if (query.status) params.set('status', query.status);
    return apiGet<PaginatedItems>(`/items?${params.toString()}`);
  },
  get: (id: string): Promise<Item> => (isMockMode() ? mockGetItem(id) : apiGet<Item>(`/items/${id}`)),
  create: (input: CreateItemInput): Promise<Item> => (isMockMode() ? mockCreateItem(input) : apiPost<Item>('/items', input)),
  update: (id: string, input: UpdateItemInput): Promise<Item> => (isMockMode() ? mockUpdateItem(id, input) : apiPatch<Item>(`/items/${id}`, input)),
  delete: (id: string): Promise<void> => (isMockMode() ? mockDeleteItem(id) : apiDelete(`/items/${id}`)),
};
