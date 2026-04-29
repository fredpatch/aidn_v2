import { Loader2 } from 'lucide-react';

export function AppLoadingScreen(): React.JSX.Element {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950" role="status" aria-label="Chargement de l’application">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}
