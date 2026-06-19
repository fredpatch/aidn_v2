import type {
  AccountRequestListItem,
  AccountRequestStatus,
  MemberRole,
} from '../../lib/api/account-requests';

export const statusLabels: Record<AccountRequestStatus, string> = {
  submitted: 'Soumise',
  under_review: 'En revue',
  approved: 'Approuvee',
  rejected: 'Rejetee',
};

export const memberRoleOptions: { value: MemberRole; label: string }[] = [
  { value: 'primary_contact', label: 'Contact principal' },
  { value: 'representative', label: 'Representant' },
  { value: 'viewer', label: 'Lecteur' },
];

export const mockRequests: AccountRequestListItem[] = [
  {
    id: 'demo-request',
    requestedOrganizationName: 'Afrijet Demo',
    requestedLegalAddress: 'Libreville',
    requestedEmail: 'contact@afrijet.example',
    requestedPhone: '+24100000000',
    approvalNumberOrigin: 'AG-001',
    contactFullName: 'Boris Klinton',
    contactEmail: 'boris@gmail.com',
    contactPhone: '+24101010101',
    status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
