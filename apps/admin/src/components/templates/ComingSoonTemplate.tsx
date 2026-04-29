import { Clock3 } from 'lucide-react';

interface ComingSoonTemplateProps {
  message?: string;
  eta?: string;
}

export function ComingSoonTemplate({ message = 'Cette section arrive bientôt.', eta }: ComingSoonTemplateProps): React.JSX.Element {
  return (
    <div className="surface grid min-h-52 place-items-center rounded-lg p-6 text-center">
      <div>
        <Clock3 className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">{message}</p>
        {eta ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{eta}</p> : null}
      </div>
    </div>
  );
}
