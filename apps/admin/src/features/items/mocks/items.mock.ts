import { waitForMockLatency } from '../../../lib/data/data-mode';
import type { CreateItemInput, Item, ItemsQuery, PaginatedItems, UpdateItemInput } from '../types';

const DEFAULT_PAGE_SIZE = 10;

let mockItems: Item[] = [
  { id: '1', name: 'Demande Alpha', description: 'Premier exemple de demande', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', name: 'Demande Beta', description: 'Deuxième exemple de demande', status: 'pending', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
  { id: '3', name: 'Demande Gamma', description: 'Troisième exemple de demande', status: 'inactive', createdAt: '2026-01-03T00:00:00Z', updatedAt: '2026-01-03T00:00:00Z' },
  { id: '4', name: 'Demande Delta', description: 'Quatrième exemple de demande', status: 'active', createdAt: '2026-01-04T00:00:00Z', updatedAt: '2026-01-04T00:00:00Z' },
  { id: '5', name: 'Demande Epsilon', description: 'Cinquième exemple de demande', status: 'archived', createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-01-05T00:00:00Z' },
];

let nextId = 6;

export async function mockListItems(query: ItemsQuery = {}): Promise<PaginatedItems> {
  await waitForMockLatency();
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const search = query.search?.toLowerCase() ?? '';
  const filtered = mockItems.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search);
    const matchesStatus = !query.status || item.status === query.status;
    return matchesSearch && matchesStatus;
  });
  const sort = query.sorting?.[0];
  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const aValue = String(a[sort.id as keyof Item] ?? '');
        const bValue = String(b[sort.id as keyof Item] ?? '');
        return sort.desc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
      })
    : filtered;
  const start = (page - 1) * pageSize;
  const totalRows = sorted.length;
  return {
    items: sorted.slice(start, start + pageSize),
    total: totalRows,
    totalRows,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(totalRows / pageSize)),
  };
}

export async function mockGetItem(id: string): Promise<Item> {
  await waitForMockLatency();
  const item = mockItems.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Élément introuvable : ${id}`);
  return { ...item };
}

export async function mockCreateItem(input: CreateItemInput): Promise<Item> {
  await waitForMockLatency();
  const now = new Date().toISOString();
  const item: Item = {
    id: String(nextId++),
    name: input.name,
    description: input.description,
    status: input.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  };
  mockItems = [item, ...mockItems];
  return item;
}

export async function mockUpdateItem(id: string, input: UpdateItemInput): Promise<Item> {
  await waitForMockLatency();
  const index = mockItems.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`Élément introuvable : ${id}`);
  mockItems[index] = { ...mockItems[index], ...input, updatedAt: new Date().toISOString() };
  return { ...mockItems[index] };
}

export async function mockDeleteItem(id: string): Promise<void> {
  await waitForMockLatency();
  const index = mockItems.findIndex((item) => item.id === id);
  if (index === -1) throw new Error(`Élément introuvable : ${id}`);
  mockItems = mockItems.filter((item) => item.id !== id);
}
