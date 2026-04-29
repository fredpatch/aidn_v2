import { Loader2 } from 'lucide-react';

interface RouteLoadingScreenProps {
  label?: string;
}

export function RouteLoadingScreen({ label = 'Chargement...' }: RouteLoadingScreenProps): React.JSX.Element {
  return (
    <div className="grid min-h-64 place-items-center" role="status" aria-label={label}>
      <div className="text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
