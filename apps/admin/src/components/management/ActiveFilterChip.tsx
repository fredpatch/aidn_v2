import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ActiveFilter } from './types';

interface ActiveFilterChipProps {
  filter: ActiveFilter;
}

export function ActiveFilterChip({ filter }: ActiveFilterChipProps): React.JSX.Element {
  return (
    <Badge variant="secondary" className="flex items-center gap-1 pr-1 font-normal">
      <span className="max-w-[140px] truncate">{filter.label}</span>
      <button
        type="button"
        onClick={filter.onRemove}
        className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label={`Retirer le filtre : ${filter.label}`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </Badge>
  );
}
