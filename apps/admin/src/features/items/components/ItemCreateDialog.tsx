import { useEffect, useState } from 'react';
import { FormField } from '@/components/common/FormField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppToast } from '@/hooks/useAppToast';
import { useCreateItem } from '../hooks/useCreateItem';

interface ItemCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (id: string) => void;
}

export function ItemCreateDialog({ open, onClose, onSuccess }: ItemCreateDialogProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useAppToast();
  const createItem = useCreateItem();

  useEffect(() => {
    if (!open) {
      setName('');
      setDescription('');
      setFormError(null);
    }
  }, [open]);

  const handleClose = () => {
    setName('');
    setDescription('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError('Le nom est obligatoire.');
      return;
    }

    setFormError(null);
    try {
      const item = await createItem.mutateAsync({ name: name.trim(), description: description.trim() });
      toast.success('Élément créé.');
      handleClose();
      onSuccess?.(item.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de la création.';
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un élément</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-2" onSubmit={(event) => { event.preventDefault(); void handleSubmit(); }}>
          <FormField
            id="item-name"
            label="Nom"
            value={name}
            onChange={setName}
            placeholder="Nom de l’élément"
            error={formError ?? undefined}
            required
          />
          <FormField
            id="item-description"
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Description courte"
          />
          <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={createItem.isPending || !name.trim()}>
            {createItem.isPending ? 'Création...' : 'Créer'}
          </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
