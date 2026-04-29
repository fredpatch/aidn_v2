import { useMemo } from 'react';
import { DataTableRowActions, createColumnHelper, type ColumnDef, type RowAction } from '@/components/data-table';
import { Checkbox } from '@/components/ui/checkbox';
import { ItemStatusBadge } from './components/ItemStatusBadge';
import type { Item } from './types';

const helper = createColumnHelper<Item>();

interface UseItemColumnsParams {
  onView: (item: Item) => void;
  onDelete: (item: Item) => void;
  enableSelection?: boolean;
}

export function useItemColumns({ onView, onDelete, enableSelection = false }: UseItemColumnsParams): ColumnDef<Item>[] {
  return useMemo(() => {
    const rowActions: RowAction<Item>[] = [
      { label: 'Voir les détails', onClick: onView },
      { label: 'Supprimer', onClick: onDelete, variant: 'destructive', separated: true },
    ];

    const columns = [
      ...(enableSelection
        ? [
            helper.display({
              id: 'select',
              header: ({ table }) => (
                <Checkbox
                  aria-label="Sélectionner toutes les lignes de cette page"
                  checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)}
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
                />
              ),
              cell: ({ row }) => (
                <div onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    aria-label={`Sélectionner ${row.original.name}`}
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
                  />
                </div>
              ),
              enableSorting: false,
              enableHiding: false,
            }),
          ]
        : []),
      helper.accessor('name', {
        header: 'Nom',
        enableSorting: true,
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      helper.accessor('description', {
        header: 'Description',
        cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
      }),
      helper.accessor('status', {
        header: 'Statut',
        cell: (info) => <ItemStatusBadge status={info.getValue()} />,
      }),
      helper.accessor('createdAt', {
        header: 'Créé le',
        enableSorting: true,
        meta: { hideOnMobile: true },
        cell: (info) => <span className="text-muted-foreground">{new Date(info.getValue()).toLocaleDateString()}</span>,
      }),
      helper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <DataTableRowActions
            row={row.original}
            actions={rowActions}
            triggerLabel={`Actions pour ${row.original.name}`}
          />
        ),
      }),
    ] as ColumnDef<Item>[];

    return columns;
  }, [enableSelection, onDelete, onView]);
}
