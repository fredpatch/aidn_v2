import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppToast } from '@/hooks/useAppToast';
import { ConfirmDialog, DetailsDialog, ErrorState, SkeletonCard } from '../../../components/states';
import { ItemStatusBadge } from './ItemStatusBadge';
import { useDeleteItem } from '../hooks/useDeleteItem';
import { useItem } from '../hooks/useItem';
import { useUpdateItem } from '../hooks/useUpdateItem';
import type { ItemStatus } from '../types';

interface ItemDetailsDialogProps {
  id: string | null;
  open: boolean;
  onClose: () => void;
}

export function ItemDetailsDialog({ id, open, onClose }: ItemDetailsDialogProps): React.JSX.Element {
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { data: item, isLoading, error, refetch } = useItem(id);
  const toast = useAppToast();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const close = () => {
    setEditMode(false);
    onClose();
  };

  const handleEdit = () => {
    if (!item) return;
    setEditName(item.name);
    setEditDescription(item.description);
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateItem.mutateAsync({ id, input: { name: editName, description: editDescription } });
      toast.success('Élément mis à jour.');
      setEditMode(false);
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Échec de la mise à jour.');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteItem.mutateAsync(id);
      toast.success('Élément supprimé.');
      setConfirmDelete(false);
      close();
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Échec de la suppression.');
    }
  };

  const handleStatusChange = async (status: ItemStatus) => {
    if (!id) return;
    try {
      await updateItem.mutateAsync({ id, input: { status } });
      toast.success('Statut mis à jour.');
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : 'Échec de la mise à jour du statut.');
    }
  };

  return (
    <>
      <DetailsDialog
        open={open}
        onClose={close}
        title={item?.name ?? 'Détails de l’élément'}
        actions={
          editMode ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setEditMode(false)}>Annuler</Button>
              <Button type="button" onClick={() => void handleSave()} disabled={updateItem.isPending}>Enregistrer</Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={handleEdit} disabled={!item}>Modifier</Button>
              <Button variant="destructive" type="button" onClick={() => setConfirmDelete(true)} disabled={!item}>Supprimer</Button>
            </div>
          )
        }
      >
        {isLoading ? <SkeletonCard lines={4} /> : null}
        {error ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}
        {item && !isLoading ? (
          <div className="space-y-4">
            {editMode ? (
              <>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nom
                  <Input className="mt-1" value={editName} onChange={(event) => setEditName(event.target.value)} />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Description
                  <Textarea className="mt-1" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
                </label>
              </>
            ) : (
              <>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Statut</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ItemStatusBadge status={item.status} />
                    <Select value={item.status} onValueChange={(value) => void handleStatusChange(value as ItemStatus)}>
                      <SelectTrigger className="h-9 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Description</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{item.description}</p>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Créé le</p>
                    <p>{new Date(item.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Mis à jour le</p>
                    <p>{new Date(item.updatedAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DetailsDialog>
      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer l’élément"
        description={`Supprimer ${item?.name ?? 'cet élément'} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={deleteItem.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
