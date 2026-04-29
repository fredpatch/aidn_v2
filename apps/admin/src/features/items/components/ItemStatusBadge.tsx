import { Badge } from '@/components/ui/badge';
import type { ItemStatus } from '../types';

const STATUS_VARIANTS: Record<ItemStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  pending: 'secondary',
  archived: 'outline',
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
  archived: 'Archivé',
};

interface ItemStatusBadgeProps {
  status: ItemStatus;
}

export function ItemStatusBadge({ status }: ItemStatusBadgeProps): React.JSX.Element {
  return <Badge variant={STATUS_VARIANTS[status] ?? 'outline'}>{STATUS_LABELS[status] ?? status}</Badge>;
}
