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

export type ListAccountRequestsParams = {
  status?: string;
  search?: string;
  from?: string;
  to?: string;
};

export type ListPostulantOrganizationsParams = {
  search?: string;
  status?: string;
};
