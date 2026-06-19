import { apiGet } from '../client';
import type { AdminDashboardParams, AdminDashboardResponse } from './types';
import { buildAdminDashboardPath } from './utils';

export type {
  AdminDashboardParams,
  AdminDashboardResponse,
  DashboardPreset,
  DashboardProfile,
} from './types';

export function getAdminDashboard(
  paramsInput: AdminDashboardParams = {},
): Promise<AdminDashboardResponse> {
  return apiGet<AdminDashboardResponse>(buildAdminDashboardPath(paramsInput));
}
