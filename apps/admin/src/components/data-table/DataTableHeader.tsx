import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { flexRender, type Header } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableHeaderProps<TData extends object> {
  header: Header<TData, unknown>;
}

export function DataTableHeader<TData extends object>({ header }: DataTableHeaderProps<TData>): React.JSX.Element {
  const canSort = header.column.getCanSort();
  const sorted = header.column.getIsSorted();
  const rawHeader = header.column.columnDef.header;
  const label = typeof rawHeader === 'string' ? rawHeader : header.id;
  const ariaSort = sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none';
  const sortLabel = sorted === 'asc' ? 'croissant' : sorted === 'desc' ? 'décroissant' : 'aucun tri';
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown;
  const content = header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext());

  return (
    <TableHead
      aria-sort={canSort ? ariaSort : undefined}
      className={cn(header.column.columnDef.meta?.hideOnMobile && 'hidden md:table-cell')}
    >
      {canSort ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          type="button"
          onClick={header.column.getToggleSortingHandler()}
          aria-label={`Trier ${label}. État actuel : ${sortLabel}`}
        >
          {content}
          <Icon className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      ) : (
        <span>{content}</span>
      )}
    </TableHead>
  );
}
