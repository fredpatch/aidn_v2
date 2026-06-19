import { apiGet, apiPost } from '../client';
import type {
  ActivateInternalAccountResponse,
  AuditLog,
  InternalAccount,
  ListAuditLogsParams,
  ListInternalAccountsFilters,
  PaginatedResponse,
  PersonnelSearchItem,
  SearchPersonnelParams,
} from './types';
import {
  buildAuditLogsPath,
  buildInternalAccountsPath,
  buildPersonnelSearchPath,
} from './utils';

export type {
  ActivateInternalAccountResponse,
  AuditLog,
  InternalAccount,
  InternalAccountStatus,
  ListAuditLogsParams,
  ListInternalAccountsFilters,
  PaginatedResponse,
  PersonnelSearchItem,
  SearchPersonnelParams,
} from './types';

export function searchPersonnel(
  paramsInput: SearchPersonnelParams,
): Promise<PaginatedResponse<PersonnelSearchItem>> {
  return apiGet<PaginatedResponse<PersonnelSearchItem>>(
    buildPersonnelSearchPath(paramsInput),
  );
}

export function listInternalAccounts(
  filters: ListInternalAccountsFilters,
): Promise<{ items: InternalAccount[] }> {
  return apiGet<{ items: InternalAccount[] }>(buildInternalAccountsPath(filters));
}

export function activateInternalAccount(
  matricule: string,
  role: string,
): Promise<ActivateInternalAccountResponse> {
  return apiPost<ActivateInternalAccountResponse>(
    '/api/v1/admin/internal-accounts/activate',
    { matricule, role },
  );
}

export function listAuditLogs(
  paramsInput: ListAuditLogsParams,
): Promise<PaginatedResponse<AuditLog>> {
  return apiGet<PaginatedResponse<AuditLog>>(buildAuditLogsPath(paramsInput));
}
