export type InternalAccountStatus = 'pending_first_login' | 'active' | 'disabled';

export type PersonnelSearchItem = {
  personnelId: string;
  matricule: string;
  fullName: string;
  email?: string;
  direction?: string;
  fonction?: string;
  activationStatus?: InternalAccountStatus;
  alreadyActivated: boolean;
  aidnRole?: string;
};

export type InternalAccount = {
  id: string;
  personnelId: string;
  matricule: string;
  userId: string;
  fullName: string;
  email?: string;
  role: string;
  status: InternalAccountStatus;
  activatedAt?: string;
  lastLoginAt?: string;
};

export type AuditLog = {
  _id: string;
  createdAt?: string;
  actorId?: string;
  actorRole?: string;
  actor?: {
    id: string;
    fullName?: string;
    matricule?: string;
    email?: string;
    role?: string;
    userType?: string;
  };
  action: string;
  entityType: string;
  entityId?: string;
  status?: string;
};

export type ActivateInternalAccountResponse = {
  account: InternalAccount;
  temporaryPassword: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type SearchPersonnelParams = {
  search: string;
  page: number;
  limit: number;
};

export type ListInternalAccountsFilters = {
  search?: string;
  role?: string;
  status?: string;
};

export type ListAuditLogsParams = {
  page: number;
  limit: number;
};
