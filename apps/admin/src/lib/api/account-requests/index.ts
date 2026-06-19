import { apiGet, apiPost } from '../client';
import type {
  AccountRequestListItem,
  ApproveAccountRequestPayload,
  ApproveAccountRequestResponse,
  ListAccountRequestsParams,
  ListPostulantOrganizationsParams,
  PostulantOrganization,
  RejectAccountRequestResponse,
} from './types';
import {
  buildAccountRequestActionPath,
  buildAccountRequestPath,
  buildAccountRequestsPath,
  buildPostulantOrganizationsPath,
} from './utils';

export type {
  AccountRequestListItem,
  AccountRequestStatus,
  ApproveAccountRequestPayload,
  ApproveAccountRequestResponse,
  ListAccountRequestsParams,
  ListPostulantOrganizationsParams,
  MemberRole,
  PostulantOrganization,
  RejectAccountRequestResponse,
} from './types';

export function listAccountRequests(
  paramsInput: ListAccountRequestsParams,
): Promise<{ items: AccountRequestListItem[] }> {
  return apiGet<{ items: AccountRequestListItem[] }>(
    buildAccountRequestsPath(paramsInput),
  );
}

export function getAccountRequest(
  id: string,
): Promise<{ request: AccountRequestListItem }> {
  return apiGet<{ request: AccountRequestListItem }>(buildAccountRequestPath(id));
}

export function approveAccountRequest(
  id: string,
  payload: ApproveAccountRequestPayload,
): Promise<ApproveAccountRequestResponse> {
  return apiPost<ApproveAccountRequestResponse>(
    buildAccountRequestActionPath(id, 'approve'),
    payload,
  );
}

export function rejectAccountRequest(
  id: string,
  payload: { reason: string },
): Promise<RejectAccountRequestResponse> {
  return apiPost<RejectAccountRequestResponse>(
    buildAccountRequestActionPath(id, 'reject'),
    payload,
  );
}

export function listPostulantOrganizations(
  paramsInput: ListPostulantOrganizationsParams,
): Promise<{ items: PostulantOrganization[] }> {
  return apiGet<{ items: PostulantOrganization[] }>(
    buildPostulantOrganizationsPath(paramsInput),
  );
}
