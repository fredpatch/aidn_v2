import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface RowAction<TData> {
  label: string;
  onClick: (row: TData) => void;
  variant?: 'default' | 'destructive';
  separated?: boolean;
}

interface DataTableRowActionsProps<TData> {
  row: TData;
  actions: RowAction<TData>[];
  triggerLabel?: string;
}

export function DataTableRowActions<TData>({
  row,
  actions,
  triggerLabel = 'Ouvrir les actions de la ligne',
}: DataTableRowActionsProps<TData>): React.JSX.Element | null {
  if (!actions.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={triggerLabel}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <div key={action.label}>
            {action.separated ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              className={cn(action.variant === 'destructive' && 'text-destructive focus:text-destructive')}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick(row);
              }}
            >
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
