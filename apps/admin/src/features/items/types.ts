export type ItemStatus = 'active' | 'inactive' | 'pending' | 'archived';

export interface Item {
  id: string;
  name: string;
  description: string;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemInput {
  name: string;
  description: string;
  status?: ItemStatus;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  status?: ItemStatus;
}

export interface ItemsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ItemStatus;
  sorting?: {
    id: string;
    desc: boolean;
  }[];
}

export interface PaginatedItems {
  items: Item[];
  total: number;
  totalRows: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
