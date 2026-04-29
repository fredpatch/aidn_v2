import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableToolbarProps {
  search?: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filterSlot?: React.ReactNode;
}

export function DataTableToolbar({
  search = '',
  onSearchChange,
  placeholder = 'Rechercher...',
  filterSlot,
}: DataTableToolbarProps): React.JSX.Element {
  const [localValue, setLocalValue] = useState(search);

  useEffect(() => {
    setLocalValue(search);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localValue !== search) onSearchChange(localValue);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [localValue, onSearchChange, search]);

  const clear = () => {
    setLocalValue('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-10"
          type="search"
        />
        {localValue ? (
          <Button className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" variant="ghost" size="icon" type="button" onClick={clear} aria-label="Effacer la recherche">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {filterSlot ? <div className="flex flex-wrap gap-2">{filterSlot}</div> : null}
    </div>
  );
}
