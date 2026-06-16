import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AidnDgDecision } from '../types/aidn.enums';

const labels: Record<AidnDgDecision, string> = {
  pending: 'En attente DG',
  oriented_to_dn: 'Orientée DN',
  redirected: 'Legacy: hors MVP',
  rejected: 'Rejetée',
};

const classNames: Record<AidnDgDecision, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  oriented_to_dn: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  redirected: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
  rejected: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

interface DgDecisionBadgeProps {
  decision: AidnDgDecision;
  className?: string;
}

export function DgDecisionBadge({ decision, className }: DgDecisionBadgeProps): React.JSX.Element {
  return (
    <Badge variant="outline" className={cn(classNames[decision], className)}>
      {labels[decision]}
    </Badge>
  );
}
