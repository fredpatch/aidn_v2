import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { EmptyState, ErrorState, SkeletonTable } from "@/components/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableHeader } from "./DataTableHeader";

interface DataTableProps<TData extends object> {
  columns: ColumnDef<TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  onRetry?: () => void;
  onRowClick?: (row: TData) => void;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  manualSorting?: boolean;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  pageCount?: number;
  enableRowSelection?: boolean;
  globalFilter?: string;
  bulkActionBar?: (selectedRows: TData[]) => React.ReactNode;
}

export function DataTable<TData extends object>({
  columns,
  data,
  getRowId,
  isLoading = false,
  error = null,
  emptyMessage = "Aucun résultat trouvé.",
  onRetry,
  onRowClick,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  rowSelection,
  onRowSelectionChange,
  manualSorting = false,
  manualPagination = false,
  manualFiltering = false,
  pageCount,
  enableRowSelection = false,
  globalFilter,
  bulkActionBar,
}: DataTableProps<TData>): React.JSX.Element {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      pagination,
      rowSelection,
      globalFilter,
    },
    pageCount,
    enableRowSelection,
    manualSorting,
    manualPagination,
    manualFiltering,
    onSortingChange,
    onPaginationChange,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
  });

  if (isLoading) return <SkeletonTable rows={5} cols={columns.length || 4} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;

  const selectedRows =
    enableRowSelection && bulkActionBar
      ? table.getSelectedRowModel().rows.map((row) => row.original)
      : [];

  return (
    <div className="space-y-3">
      {enableRowSelection && selectedRows.length > 0 && bulkActionBar
        ? bulkActionBar(selectedRows)
        : null}
      <div className="surface rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <DataTableHeader key={header.id} header={header} />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    enableRowSelection && row.getIsSelected()
                      ? "selected"
                      : undefined
                  }
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.hideOnMobile &&
                          "hidden md:table-cell",
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState message={emptyMessage} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
