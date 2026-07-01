import { apiGet, apiPatch, apiPost } from '../client';
import type {
  ActivateInternalAccountResponse,
  AuditLog,
  InternalAccount,
  InternalAccountCredentialResponse,
  InternalAccountMutationResponse,
  ListAuditLogsParams,
  ListInternalAccountsFilters,
  PaginatedResponse,
  PersonnelSearchItem,
  SearchPersonnelParams,
  SeedFormalRequestRequirementsResponse,
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
  InternalAccountCredentialResponse,
  InternalAccountMutationResponse,
  InternalAccountStatus,
  ListAuditLogsParams,
  ListInternalAccountsFilters,
  PaginatedResponse,
  PersonnelSearchItem,
  SearchPersonnelParams,
  SeedFormalRequestRequirementsResponse,
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

export function resetInternalAccountPassword(
  accountId: string,
): Promise<InternalAccountCredentialResponse> {
  return apiPost<InternalAccountCredentialResponse>(
    `/api/v1/admin/internal-accounts/${accountId}/reset-password`,
    {},
  );
}

export function updateInternalAccountRole(
  accountId: string,
  role: string,
): Promise<InternalAccountMutationResponse> {
  return apiPatch<InternalAccountMutationResponse>(
    `/api/v1/admin/internal-accounts/${accountId}/role`,
    { role },
  );
}

export function disableInternalAccount(
  accountId: string,
): Promise<InternalAccountMutationResponse> {
  return apiPost<InternalAccountMutationResponse>(
    `/api/v1/admin/internal-accounts/${accountId}/disable`,
    {},
  );
}

export function reactivateInternalAccount(
  accountId: string,
): Promise<InternalAccountCredentialResponse> {
  return apiPost<InternalAccountCredentialResponse>(
    `/api/v1/admin/internal-accounts/${accountId}/reactivate`,
    {},
  );
}

export function listAuditLogs(
  paramsInput: ListAuditLogsParams,
): Promise<PaginatedResponse<AuditLog>> {
  return apiGet<PaginatedResponse<AuditLog>>(buildAuditLogsPath(paramsInput));
}

export function seedFormalRequestRequirements(): Promise<SeedFormalRequestRequirementsResponse> {
  return apiPost<SeedFormalRequestRequirementsResponse>(
    '/api/v1/admin/document-requirements/seed-formal-request',
    {},
  );
}
