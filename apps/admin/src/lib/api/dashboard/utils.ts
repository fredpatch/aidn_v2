import type { AdminDashboardParams } from './types';

export function buildAdminDashboardPath(paramsInput: AdminDashboardParams = {}): string {
  const params = new URLSearchParams();
  if (paramsInput.preset) params.set('preset', paramsInput.preset);
  if (paramsInput.from) params.set('from', paramsInput.from);
  if (paramsInput.to) params.set('to', paramsInput.to);

  const query = params.toString();
  return `/api/v1/admin/dashboard${query ? `?${query}` : ''}`;
}
