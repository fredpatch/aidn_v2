import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Une erreur est survenue.', onRetry }: ErrorStateProps): React.JSX.Element {
  return (
    <div className="surface grid min-h-48 place-items-center rounded-lg p-6 text-center" role="alert">
      <div>
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
        {onRetry ? (
          <button className="btn btn-secondary mt-4" type="button" onClick={onRetry}>
            Réessayer
          </button>
        ) : null}
      </div>
    </div>
  );
}
