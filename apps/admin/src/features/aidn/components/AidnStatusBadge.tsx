import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AidnDemandStatus, AidnDossierStatus, AidnInternalDemandeStatus } from '../types/aidn.enums';
import { dossierStatusLabels, internalDemandeStatusLabels, legacyDemandStatusLabels } from './aidn-status-labels';

const classNames: Partial<Record<AidnDemandStatus | AidnDossierStatus | AidnInternalDemandeStatus, string>> = {
  waiting_dg_orientation: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  in_dg_circuit: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  dg_return_received: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  dg_instruction_recorded: 'border-primary/20 bg-primary/10 text-primary',
  ready_for_dn_dossier: 'border-primary/20 bg-primary/10 text-primary',
  oriented_to_dn: 'border-primary/20 bg-primary/10 text-primary',
  dn_dossier_opened: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  rejected: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  late: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
};

interface AidnStatusBadgeProps {
  status: AidnDemandStatus | AidnDossierStatus | AidnInternalDemandeStatus;
  className?: string;
}

export function AidnStatusBadge({ status, className }: AidnStatusBadgeProps): React.JSX.Element {
  const label =
    internalDemandeStatusLabels[status as AidnInternalDemandeStatus] ??
    legacyDemandStatusLabels[status as AidnDemandStatus] ??
    dossierStatusLabels[status as AidnDossierStatus];

  return (
    <Badge variant="outline" className={cn(classNames[status], className)}>
      {label}
    </Badge>
  );
}
