import {
  createColumnHelper,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    hideOnMobile?: boolean;
  }
}

export { createColumnHelper };
export type { ColumnDef, OnChangeFn, PaginationState, Row, RowSelectionState, SortingState };

/*
 * Optional row-selection column pattern:
 * helper.display({
 *   id: 'select',
 *   header: ({ table }) => <Checkbox aria-label="Select all rows on this page" ... />,
 *   cell: ({ row }) => (
 *     <div onClick={(event) => event.stopPropagation()}>
 *       <Checkbox aria-label={`Select ${row.id}`} ... />
 *     </div>
 *   ),
 * })
 */
