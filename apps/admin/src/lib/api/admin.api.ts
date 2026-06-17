import { apiGet, apiPost } from './client';

export type PersonnelSearchItem = {
  personnelId: string;
  matricule: string;
  fullName: string;
  email?: string;
  direction?: string;
  fonction?: string;
  activationStatus?: InternalAccountStatus;
  alreadyActivated: boolean;
  aidnRole?: string;
};

export type InternalAccountStatus = 'pending_first_login' | 'active' | 'disabled';

export type InternalAccount = {
  id: string;
  personnelId: string;
  matricule: string;
  userId: string;
  fullName: string;
  email?: string;
  role: string;
  status: InternalAccountStatus;
  activatedAt?: string;
  lastLoginAt?: string;
};

export type AuditLog = {
  _id: string;
  createdAt?: string;
  actorId?: string;
  actorRole?: string;
  actor?: {
    id: string;
    fullName?: string;
    matricule?: string;
    email?: string;
    role?: string;
    userType?: string;
  };
  action: string;
  entityType: string;
  entityId?: string;
  status?: string;
};

export type ActivateInternalAccountResponse = {
  account: InternalAccount;
  temporaryPassword: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export function searchPersonnel(paramsInput: {
  search: string;
  page: number;
  limit: number;
}): Promise<PaginatedResponse<PersonnelSearchItem>> {
  const params = new URLSearchParams({
    search: paramsInput.search,
    page: String(paramsInput.page),
    limit: String(paramsInput.limit),
  });
  return apiGet<PaginatedResponse<PersonnelSearchItem>>(`/api/v1/admin/personnel?${params.toString()}`);
}

export function listInternalAccounts(filters: {
  search?: string;
  role?: string;
  status?: string;
}): Promise<{ items: InternalAccount[] }> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return apiGet<{ items: InternalAccount[] }>(`/api/v1/admin/internal-accounts${query ? `?${query}` : ''}`);
}

export function activateInternalAccount(matricule: string, role: string): Promise<ActivateInternalAccountResponse> {
  return apiPost<ActivateInternalAccountResponse>('/api/v1/admin/internal-accounts/activate', { matricule, role });
}

export function listAuditLogs(paramsInput: { page: number; limit: number }): Promise<PaginatedResponse<AuditLog>> {
  const params = new URLSearchParams({
    page: String(paramsInput.page),
    limit: String(paramsInput.limit),
  });
  return apiGet<PaginatedResponse<AuditLog>>(`/api/v1/admin/audit-logs?${params.toString()}`);
}
