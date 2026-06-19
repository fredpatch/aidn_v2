import type { PhasePaymentTaskFilters } from './types';

export function buildPhasePaymentTasksPath(
  filters: PhasePaymentTaskFilters = {},
): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.phaseKey) params.set('phaseKey', filters.phaseKey);
  if (filters.paymentType) params.set('paymentType', filters.paymentType);

  const query = params.toString();
  return `/api/v1/admin/payments/phase-payments${query ? `?${query}` : ''}`;
}
