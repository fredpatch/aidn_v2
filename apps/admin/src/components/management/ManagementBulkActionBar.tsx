import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ManagementBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: ReactNode;
  selectedLabel?: string;
}

export function ManagementBulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  selectedLabel = 'sélectionné(s)',
}: ManagementBulkActionBarProps): React.JSX.Element | null {
  if (selectedCount === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-2.5"
      role="toolbar"
      aria-label={`${selectedCount} ${selectedLabel} - actions groupées`}
    >
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {selectedCount} {selectedLabel}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
        aria-label="Effacer la sélection"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        Effacer
      </Button>
      <Separator orientation="vertical" className="h-5 shrink-0" />
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
