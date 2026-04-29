import { Loader2 } from 'lucide-react';

export function AuthLoadingScreen(): React.JSX.Element {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}
