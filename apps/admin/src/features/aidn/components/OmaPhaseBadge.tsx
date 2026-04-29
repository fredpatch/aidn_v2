import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AidnOmaPhaseStatus } from '../types/aidn.enums';

const labels: Record<AidnOmaPhaseStatus, string> = {
  not_started: 'Non démarrée',
  in_progress: 'En cours',
  blocked: 'Bloquée',
  late: 'En retard',
  completed: 'Clôturée',
};

const classNames: Record<AidnOmaPhaseStatus, string> = {
  not_started: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  in_progress: 'border-primary/20 bg-primary/10 text-primary',
  blocked: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  late: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
};

interface OmaPhaseBadgeProps {
  status: AidnOmaPhaseStatus;
  className?: string;
}

export function OmaPhaseBadge({ status, className }: OmaPhaseBadgeProps): React.JSX.Element {
  return (
    <Badge variant="outline" className={cn(classNames[status], className)}>
      {labels[status]}
    </Badge>
  );
}
