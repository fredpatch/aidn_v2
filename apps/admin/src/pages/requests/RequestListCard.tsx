import { Badge } from '../../components/ui/badge';
import type { AdminRequest } from '../../lib/api/requests.api';
import {
  formatDate,
  getStatusLabel,
  listCardAccentBorder,
  sourceLabels,
  statusBadgeVariant,
} from './requests.helpers';

export function RequestListCard({
  item,
  isSelected,
  onClick,
}: {
  item: AdminRequest;
  isSelected: boolean;
  onClick: () => void;
}) {
  const accentBorder = listCardAccentBorder(item.status);
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-md border border-l-4 bg-background p-3 text-left transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary ring-1 ring-primary'
          : `border-slate-200 dark:border-slate-800 ${accentBorder}`,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {item.organization?.canonicalName ?? item.organizationId}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {item.submittedBy?.fullName ?? item.submittedBy?.email ?? '-'}
          </p>
          <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">
            {item.subject}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDate(item.submittedAt ?? item.createdAt)}
          </p>
          <Badge variant={statusBadgeVariant(item.status)} className="text-xs">
            {getStatusLabel(item)}
          </Badge>
          {item.courrierSource ? (
            <span className="text-xs text-muted-foreground">
              {sourceLabels[item.courrierSource]}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
