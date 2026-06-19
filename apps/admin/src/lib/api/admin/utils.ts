import type {
  ListAuditLogsParams,
  ListInternalAccountsFilters,
  SearchPersonnelParams,
} from './types';

export function buildPersonnelSearchPath(paramsInput: SearchPersonnelParams): string {
  const params = new URLSearchParams({
    search: paramsInput.search,
    page: String(paramsInput.page),
    limit: String(paramsInput.limit),
  });
  return `/api/v1/admin/personnel?${params.toString()}`;
}

export function buildInternalAccountsPath(filters: ListInternalAccountsFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);

  const query = params.toString();
  return `/api/v1/admin/internal-accounts${query ? `?${query}` : ''}`;
}

export function buildAuditLogsPath(paramsInput: ListAuditLogsParams): string {
  const params = new URLSearchParams({
    page: String(paramsInput.page),
    limit: String(paramsInput.limit),
  });
  return `/api/v1/admin/audit-logs?${params.toString()}`;
}
