import { Inbox } from 'lucide-react';

interface EmptyStateTemplateProps {
  message?: string;
  action?: React.ReactNode;
}

export function EmptyStateTemplate({ message = 'Aucune donnée disponible.', action }: EmptyStateTemplateProps): React.JSX.Element {
  return (
    <div className="surface grid min-h-52 place-items-center rounded-lg p-6 text-center">
      <div>
        <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
