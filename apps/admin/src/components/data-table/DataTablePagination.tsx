import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalRows?: number;
  pageSizeOptions?: number[];
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

// URL-based pagination is owned by the page component; this component only emits page/page-size callbacks.
export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalRows,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps): React.JSX.Element {
  const isUnknownPageCount = pageCount === -1;
  const isFirstPage = pageIndex <= 0;
  const isLastPage = !isUnknownPageCount && pageIndex >= pageCount - 1;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {typeof totalRows === 'number' ? `${totalRows} ligne${totalRows === 1 ? '' : 's'}` : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {isUnknownPageCount ? `Page ${pageIndex + 1}` : `Page ${pageIndex + 1} sur ${Math.max(pageCount, 1)}`}
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            onPageSizeChange(Number(value));
            onPageChange(0);
          }}
        >
          <SelectTrigger className="h-9 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" type="button" onClick={() => onPageChange(0)} disabled={isFirstPage} aria-label="Aller à la première page">
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" type="button" onClick={() => onPageChange(pageIndex - 1)} disabled={isFirstPage} aria-label="Aller à la page précédente">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" type="button" onClick={() => onPageChange(pageIndex + 1)} disabled={isLastPage} aria-label="Aller à la page suivante">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={isUnknownPageCount || isLastPage}
          aria-label="Aller à la dernière page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
