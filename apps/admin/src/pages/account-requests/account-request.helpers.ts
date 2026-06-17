import type {
  AccountRequestListItem,
  AccountRequestStatus,
} from '../../lib/api/account-requests.api';

export function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function optional(value: string): string | undefined {
  const next = value.trim();
  return next ? next : undefined;
}

export function statusBadgeVariant(
  status: AccountRequestStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'under_review') return 'secondary';
  return 'outline';
}

export function isFinalized(request: AccountRequestListItem): boolean {
  return request.status === 'approved' || request.status === 'rejected';
}
