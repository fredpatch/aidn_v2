import type { SortingState } from '@tanstack/react-table';

export interface ActiveFilter {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface SavedViewState {
  search?: string;
  filters?: Record<string, unknown>;
  sorting?: SortingState;
  pageSize?: number;
}

export interface SavedView {
  id: string;
  name: string;
  state: SavedViewState;
  createdAt: string;
}
