import type {
  ListAccountRequestsParams,
  ListPostulantOrganizationsParams,
} from './types';

export function buildAccountRequestsPath(paramsInput: ListAccountRequestsParams): string {
  const params = new URLSearchParams();
  if (paramsInput.status) params.set('status', paramsInput.status);
  if (paramsInput.search) params.set('search', paramsInput.search);
  if (paramsInput.from) params.set('from', paramsInput.from);
  if (paramsInput.to) params.set('to', paramsInput.to);

  const query = params.toString();
  return `/api/v1/admin/account-requests${query ? `?${query}` : ''}`;
}

export function buildAccountRequestPath(id: string): string {
  return `/api/v1/admin/account-requests/${id}`;
}

export function buildAccountRequestActionPath(id: string, action: string): string {
  return `${buildAccountRequestPath(id)}/${action}`;
}

export function buildPostulantOrganizationsPath(
  paramsInput: ListPostulantOrganizationsParams,
): string {
  const params = new URLSearchParams();
  if (paramsInput.search) params.set('search', paramsInput.search);
  if (paramsInput.status) params.set('status', paramsInput.status);

  const query = params.toString();
  return `/api/v1/admin/organizations${query ? `?${query}` : ''}`;
}
