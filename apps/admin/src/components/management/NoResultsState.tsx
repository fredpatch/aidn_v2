import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoResultsStateProps {
  message?: string;
  description?: string;
  onClear?: () => void;
  clearLabel?: string;
}

export function NoResultsState({
  message = 'Aucun résultat trouvé',
  description = 'Aucun élément ne correspond à la recherche ou aux filtres actuels.',
  onClear,
  clearLabel = 'Effacer les filtres',
}: NoResultsStateProps): React.JSX.Element {
  return (
    <div className="surface flex flex-col items-center justify-center rounded-lg py-16 text-center" role="status" aria-live="polite">
      <SearchX className="mb-4 h-10 w-10 text-muted-foreground opacity-50" aria-hidden="true" />
      <p className="text-base font-medium">{message}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onClear ? (
        <Button variant="outline" size="sm" onClick={onClear} className="mt-4">
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
