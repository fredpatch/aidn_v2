import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api/client';
import { isMockMode } from '../../../lib/data/data-mode';
import {
  mockCreateItem,
  mockDeleteItem,
  mockGetItem,
  mockListItems,
  mockUpdateItem,
} from '../mocks/items.mock';
import type {
  CreateItemInput,
  Item,
  ItemsQuery,
  PaginatedItems,
  UpdateItemInput,
} from '../types';
import { buildItemPath, buildItemsPath } from './utils';

export const itemsApi = {
  list: (query: ItemsQuery = {}): Promise<PaginatedItems> =>
    isMockMode() ? mockListItems(query) : apiGet<PaginatedItems>(buildItemsPath(query)),

  get: (id: string): Promise<Item> =>
    isMockMode() ? mockGetItem(id) : apiGet<Item>(buildItemPath(id)),

  create: (input: CreateItemInput): Promise<Item> =>
    isMockMode() ? mockCreateItem(input) : apiPost<Item>('/items', input),

  update: (id: string, input: UpdateItemInput): Promise<Item> =>
    isMockMode() ? mockUpdateItem(id, input) : apiPatch<Item>(buildItemPath(id), input),

  delete: (id: string): Promise<void> =>
    isMockMode() ? mockDeleteItem(id) : apiDelete(buildItemPath(id)),
};
