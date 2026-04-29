import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ActiveFilterChip } from './ActiveFilterChip';
import type { ActiveFilter } from './types';

interface ManagementFilterPanelProps {
  isOpen: boolean;
  activeFilters: ActiveFilter[];
  onClear: () => void;
  children: ReactNode;
  clearLabel?: string;
}

export function ManagementFilterPanel({
  isOpen,
  activeFilters,
  onClear,
  children,
  clearLabel = 'Tout effacer',
}: ManagementFilterPanelProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4" role="region" aria-label="Filtres">
      <div className="flex flex-wrap gap-3">{children}</div>
      {activeFilters.length > 0 ? (
        <>
          <Separator />
          <div className="flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">Filtres actifs :</span>
            {activeFilters.map((filter) => (
              <ActiveFilterChip key={filter.id} filter={filter} />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="ml-auto h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {clearLabel}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
