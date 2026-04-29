import { useState } from 'react';
import { Bookmark, Check, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useSavedViews } from '@/hooks/useSavedViews';
import type { SavedViewState } from './types';

interface SavedViewSelectorProps {
  storageKey: string;
  currentState: SavedViewState;
  onApply: (state: SavedViewState) => void;
}

export function SavedViewSelector({ storageKey, currentState, onApply }: SavedViewSelectorProps): React.JSX.Element {
  const { savedViews, saveView, deleteView } = useSavedViews(storageKey);
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function handleSave() {
    const trimmed = saveName.trim();
    if (!trimmed) return;
    saveView(trimmed, currentState);
    setSaveName('');
    setIsSaving(false);
  }

  function handleApply(state: SavedViewState) {
    onApply(state);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Vues enregistrées${savedViews.length > 0 ? `, ${savedViews.length} enregistrée(s)` : ''}`}>
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          Vues
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        {savedViews.length > 0 ? (
          <div className="mb-2 space-y-0.5">
            {savedViews.map((view) => (
              <div key={view.id} className="group flex items-center gap-1 rounded-sm px-1 hover:bg-muted">
                <button
                  type="button"
                  onClick={() => handleApply(view.state)}
                  className="flex flex-1 items-center gap-2 py-1.5 text-left text-sm"
                  aria-label={`Appliquer la vue : ${view.name}`}
                >
                  <Check className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" aria-hidden="true" />
                  <span className="truncate">{view.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteView(view.id)}
                  className="rounded-sm p-1 text-muted-foreground opacity-0 hover:text-destructive focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring group-hover:opacity-100"
                  aria-label={`Supprimer la vue : ${view.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-3 text-center text-xs text-muted-foreground">Aucune vue enregistrée</p>
        )}

        <Separator className="my-1" />

        {isSaving ? (
          <div className="mt-2 flex gap-1.5">
            <Input
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              placeholder="Nom de la vue..."
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSave();
                if (event.key === 'Escape') setIsSaving(false);
              }}
              aria-label="Nom de la vue enregistrée"
            />
            <Button size="sm" className="h-7 px-2" onClick={handleSave} disabled={!saveName.trim()} aria-label="Confirmer l’enregistrement">
              Enregistrer
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start text-xs text-muted-foreground"
            onClick={() => setIsSaving(true)}
          >
            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
            Enregistrer la vue actuelle
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
