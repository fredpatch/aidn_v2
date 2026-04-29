import { useQuery } from '@tanstack/react-query';
import { isMockMode } from '../../../lib/data/data-mode';
import { mockGetDashboard } from '../mocks/dashboard.mock';
import type { DashboardSummary } from '../types';

export function useDashboard() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => (isMockMode() ? mockGetDashboard() : Promise.reject(new Error('Dashboard API not configured'))),
    staleTime: 30_000,
  });
}
