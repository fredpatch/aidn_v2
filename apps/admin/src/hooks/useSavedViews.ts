import { useCallback, useState } from 'react';
import type { SavedView, SavedViewState } from '@/components/management/types';

function readViews(storageKey: string): SavedView[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw) as SavedView[];
  } catch {
    return [];
  }
}

function writeViews(storageKey: string, views: SavedView[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(views));
  } catch {
    // localStorage can be unavailable or full.
  }
}

export function useSavedViews(storageKey: string) {
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => readViews(storageKey));

  const saveView = useCallback(
    (name: string, state: SavedViewState) => {
      const nextView: SavedView = {
        id: `view-${Date.now()}`,
        name: name.trim(),
        state,
        createdAt: new Date().toISOString(),
      };
      const updated = [...savedViews, nextView];
      setSavedViews(updated);
      writeViews(storageKey, updated);
    },
    [savedViews, storageKey],
  );

  const deleteView = useCallback(
    (id: string) => {
      const updated = savedViews.filter((view) => view.id !== id);
      setSavedViews(updated);
      writeViews(storageKey, updated);
    },
    [savedViews, storageKey],
  );

  return { savedViews, saveView, deleteView };
}
