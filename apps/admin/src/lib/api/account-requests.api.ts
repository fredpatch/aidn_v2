import { apiGet, apiPost } from './client';

export type AccountRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type AccountRequestListItem = {
  id: string;
  requestedOrganizationName: string;
  requestedLegalAddress?: string;
  requestedEmail?: string;
  requestedPhone?: string;
  approvalNumberOrigin?: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone?: string;
  status: AccountRequestStatus;
  matchedOrganizationId?: string;
  createdOrganizationId?: string;
  resultingUserId?: string;
  reviewedById?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type PostulantOrganization = {
  id: string;
  canonicalName: string;
  normalizedName: string;
  aliases: string[];
  legalAddress?: string;
  email?: string;
  phone?: string;
  approvalNumberOrigin?: string;
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
};

export type MemberRole = 'primary_contact' | 'representative' | 'viewer';

export type ApproveAccountRequestPayload =
  | {
      organizationMode: 'existing';
      organizationId: string;
      memberRole?: MemberRole;
    }
  | {
      organizationMode: 'create';
      organization: {
        canonicalName: string;
        legalAddress?: string;
        email?: string;
        phone?: string;
        approvalNumberOrigin?: string;
        aliases?: string[];
      };
      memberRole?: MemberRole;
    };

export type ApproveAccountRequestResponse = {
  request: AccountRequestListItem;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: 'postulant';
    organizationId: string;
  };
  organization: {
    id: string;
    canonicalName: string;
  };
  membership: {
    id: string;
    memberRole: MemberRole;
    status: 'active';
  };
};

export type RejectAccountRequestResponse = {
  request: {
    id: string;
    status: 'rejected';
    rejectionReason: string;
    reviewedAt: string;
  };
};

export function listAccountRequests(paramsInput: {
  status?: string;
  search?: string;
  from?: string;
  to?: string;
}): Promise<{ items: AccountRequestListItem[] }> {
  const params = new URLSearchParams();
  if (paramsInput.status) params.set('status', paramsInput.status);
  if (paramsInput.search) params.set('search', paramsInput.search);
  if (paramsInput.from) params.set('from', paramsInput.from);
  if (paramsInput.to) params.set('to', paramsInput.to);
  const query = params.toString();

  return apiGet<{ items: AccountRequestListItem[] }>(
    `/api/v1/admin/account-requests${query ? `?${query}` : ''}`,
  );
}

export function getAccountRequest(
  id: string,
): Promise<{ request: AccountRequestListItem }> {
  return apiGet<{ request: AccountRequestListItem }>(
    `/api/v1/admin/account-requests/${id}`,
  );
}

export function approveAccountRequest(
  id: string,
  payload: ApproveAccountRequestPayload,
): Promise<ApproveAccountRequestResponse> {
  return apiPost<ApproveAccountRequestResponse>(
    `/api/v1/admin/account-requests/${id}/approve`,
    payload,
  );
}

export function rejectAccountRequest(
  id: string,
  payload: { reason: string },
): Promise<RejectAccountRequestResponse> {
  return apiPost<RejectAccountRequestResponse>(
    `/api/v1/admin/account-requests/${id}/reject`,
    payload,
  );
}

export function listPostulantOrganizations(paramsInput: {
  search?: string;
  status?: string;
}): Promise<{ items: PostulantOrganization[] }> {
  const params = new URLSearchParams();
  if (paramsInput.search) params.set('search', paramsInput.search);
  if (paramsInput.status) params.set('status', paramsInput.status);
  const query = params.toString();

  return apiGet<{ items: PostulantOrganization[] }>(
    `/api/v1/admin/organizations${query ? `?${query}` : ''}`,
  );
}
