interface RetryStateProps {
  onRetry: () => void;
  message?: string;
}

export function RetryState({ onRetry, message = 'Échec du chargement. Réessayer ?' }: RetryStateProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <span>{message}</span>
      <button className="btn btn-secondary min-h-8 px-3 py-1" type="button" onClick={onRetry}>
        Réessayer
      </button>
    </div>
  );
}
