import { useCallback, useMemo, useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  ManagementBulkActionBar,
  ManagementFilterPanel,
  ManagementHeader,
  ManagementPageShell,
  ManagementToolbar,
  NoResultsState,
  SavedViewSelector,
  type ActiveFilter,
  type SavedViewState,
} from '@/components/management';
import { ConfirmDialog } from '@/components/states';
import { DataTable, DataTablePagination, type PaginationState, type RowSelectionState, type SortingState } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppToast } from '@/hooks/useAppToast';
import { ItemCreateDialog } from './ItemCreateDialog';
import { ItemDetailsDialog } from './ItemDetailsDialog';
import { useItemColumns } from '../columns';
import { useDeleteItem } from '../hooks/useDeleteItem';
import { useItemsList } from '../hooks/useItemsList';
import type { Item, ItemStatus } from '../types';

const SAVED_VIEWS_KEY = 'saved-views:items';

interface ItemFilters {
  status: ItemStatus | '';
}

function isItemStatus(value: string | null): value is ItemStatus {
  return value === 'active' || value === 'inactive' || value === 'pending' || value === 'archived';
}

function toItemFilters(filters: SavedViewState['filters']): ItemFilters {
  const status = filters?.status;
  return { status: typeof status === 'string' && isItemStatus(status) ? status : '' };
}

export function ItemsPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const toast = useAppToast();
  const deleteItem = useDeleteItem();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? '10'));
  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort');
  const order = searchParams.get('order');
  const status = isItemStatus(searchParams.get('status')) ? searchParams.get('status') as ItemStatus : '';
  const sorting = useMemo<SortingState>(() => (sort ? [{ id: sort, desc: order === 'desc' }] : []), [order, sort]);
  const pagination = useMemo<PaginationState>(() => ({ pageIndex: page - 1, pageSize }), [page, pageSize]);
  const { data, isLoading, error, refetch, isFetching } = useItemsList({
    page,
    pageSize,
    search,
    sorting,
    status: status || undefined,
  });

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      });
      setRowSelection({});
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const columns = useItemColumns({
    onView: (item) => setSelectedId(item.id),
    onDelete: (item) => setDeleteTarget(item),
    enableSelection: true,
  });

  const activeFilters = useMemo((): ActiveFilter[] => {
    if (!status) return [];
    return [
      {
        id: 'status',
        label: `Statut : ${status}`,
        onRemove: () => updateParams({ status: null, page: '1' }),
      },
    ];
  }, [status, updateParams]);

  const currentViewState = useMemo(
    (): SavedViewState => ({
      search,
      filters: { status },
      sorting,
      pageSize,
    }),
    [pageSize, search, sorting, status],
  );

  const selectedCount = useMemo(() => Object.values(rowSelection).filter(Boolean).length, [rowSelection]);
  const hasActiveFilters = Boolean(search || status);
  const showNoResults = !isLoading && !error && hasActiveFilters && (data?.items.length ?? 0) === 0;

  const handleSearch = (value: string) => {
    updateParams({ search: value, page: '1' });
  };

  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const nextSorting = typeof updater === 'function' ? updater(sorting) : updater;
    const first = nextSorting[0];
    updateParams({ sort: first?.id ?? null, order: first ? (first.desc ? 'desc' : 'asc') : null, page: '1' });
  };

  const handlePaginationChange = (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const nextPagination = typeof updater === 'function' ? updater(pagination) : updater;
    updateParams({ page: String(nextPagination.pageIndex + 1), pageSize: String(nextPagination.pageSize) });
  };

  const handleStatusChange = (value: string) => {
    updateParams({ status: value === 'all' ? null : value, page: '1' });
  };

  const handleClearAll = () => {
    updateParams({ search: null, status: null, page: '1' });
  };

  const handleApplyView = (state: SavedViewState) => {
    const filters = toItemFilters(state.filters);
    const nextSorting = state.sorting?.[0];
    updateParams({
      search: state.search ?? null,
      status: filters.status || null,
      sort: nextSorting?.id ?? null,
      order: nextSorting ? (nextSorting.desc ? 'desc' : 'asc') : null,
      pageSize: state.pageSize ? String(state.pageSize) : null,
      page: '1',
    });
  };

  const handleBulkDelete = () => {
    const ids = Object.entries(rowSelection).filter(([, selected]) => selected).map(([id]) => id);
    toast.info(`La suppression groupée n’est pas encore implémentée. Sélection : ${ids.join(', ')}`);
    setRowSelection({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem.mutateAsync(deleteTarget.id);
      toast.success('Élément supprimé.');
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Échec de la suppression.');
    }
  };

  return (
    <ManagementPageShell
      className="page-container"
      header={
        <ManagementHeader
          title="Référence de gestion"
          subtitle="Écran de démonstration conservé pour les composants de gestion."
          actionsSlot={
            <Button type="button" variant="outline" disabled aria-label="Export à venir">
              <Download className="h-4 w-4" aria-hidden="true" />
              Exporter
            </Button>
          }
          createSlot={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer
            </Button>
          }
        />
      }
      toolbar={
        <ManagementToolbar
          searchValue={search}
          onSearchChange={handleSearch}
          searchPlaceholder="Rechercher..."
          filterCount={activeFilters.length}
          onFilterToggle={() => setIsFilterOpen((open) => !open)}
          isFilterOpen={isFilterOpen}
          onRefresh={() => void refetch()}
          isRefreshing={isFetching}
          savedViewsSlot={
            <SavedViewSelector
              storageKey={SAVED_VIEWS_KEY}
              currentState={currentViewState}
              onApply={handleApplyView}
            />
          }
          actionSlot={
            <Button type="button" className="md:hidden" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer
            </Button>
          }
        />
      }
      filterPanel={
        <ManagementFilterPanel isOpen={isFilterOpen} activeFilters={activeFilters} onClear={handleClearAll}>
          <div className="flex items-center gap-2">
            <label className="shrink-0 text-sm font-medium" htmlFor="filter-status">
              Statut
            </label>
            <Select value={status || 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger id="filter-status" className="h-9 w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ManagementFilterPanel>
      }
      bulkActionBar={
        <ManagementBulkActionBar
          selectedCount={selectedCount}
          onClearSelection={() => setRowSelection({})}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Supprimer ({selectedCount})
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4" aria-hidden="true" />
                Exporter
              </Button>
            </>
          }
        />
      }
      table={
        showNoResults ? (
          <NoResultsState onClear={handleClearAll} />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyMessage="Aucun élément trouvé."
            onRowClick={(item) => setSelectedId(item.id)}
            onRetry={() => void refetch()}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            manualSorting
            manualPagination
            pageCount={data?.pageCount ?? -1}
            enableRowSelection
          />
        )
      }
      pagination={
        showNoResults ? undefined : (
          <DataTablePagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            pageCount={data?.pageCount ?? -1}
            totalRows={data?.totalRows}
            onPageChange={(pageIndex) => updateParams({ page: String(pageIndex + 1) })}
            onPageSizeChange={(nextPageSize) => updateParams({ pageSize: String(nextPageSize), page: '1' })}
          />
        )
      }
    >

      <ItemCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={(id) => setSelectedId(id)} />
      <ItemDetailsDialog id={selectedId} open={Boolean(selectedId)} onClose={() => setSelectedId(null)} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer l’élément"
        description={`Supprimer ${deleteTarget?.name ?? 'cet élément'} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={deleteItem.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </ManagementPageShell>
  );
}
