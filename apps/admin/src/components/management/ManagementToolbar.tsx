import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ManagementToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterCount?: number;
  onFilterToggle?: () => void;
  isFilterOpen?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  savedViewsSlot?: ReactNode;
  actionSlot?: ReactNode;
}

export function ManagementToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  filterCount = 0,
  onFilterToggle,
  isFilterOpen = false,
  onRefresh,
  isRefreshing = false,
  savedViewsSlot,
  actionSlot,
}: ManagementToolbarProps): React.JSX.Element {
  const [localValue, setLocalValue] = useState(searchValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(searchValue);
  }, [searchValue]);

  function clearDebounce() {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }

  function handleChange(value: string) {
    setLocalValue(value);
    clearDebounce();
    debounceRef.current = window.setTimeout(() => onSearchChange(value), 300);
  }

  function handleClear() {
    setLocalValue('');
    clearDebounce();
    onSearchChange('');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={localValue}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8 pr-8"
          aria-label="Rechercher"
        />
        {localValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label="Effacer la recherche"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {onFilterToggle ? (
        <div className="relative">
          <Button
            variant={isFilterOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={onFilterToggle}
            aria-expanded={isFilterOpen}
            aria-label={`${isFilterOpen ? 'Masquer' : 'Afficher'} les filtres${filterCount > 0 ? `, ${filterCount} actif(s)` : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtres
          </Button>
          {filterCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center p-0 text-[10px] leading-none"
              aria-hidden="true"
            >
              {filterCount > 9 ? '9+' : filterCount}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {savedViewsSlot}
      <div className="flex-1" aria-hidden="true" />

      {onRefresh ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? 'Actualisation...' : 'Actualiser les données'}
        >
          <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden="true" />
        </Button>
      ) : null}

      {actionSlot}
    </div>
  );
}
