import { APP_ENV, APP_NAME, APP_VERSION } from '../config/app';

export function getEnvironmentBadgeClass(environment: string): string {
  const classes: Record<string, string> = {
    local: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600',
    development: 'bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/40',
    staging: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
    production: 'bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700',
  };

  return classes[environment] ?? classes.local;
}

export function Footer(): React.JSX.Element {
  return (
    <footer className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <span>{APP_NAME}</span>
      <div className="flex items-center gap-2">
        <span>v{APP_VERSION}</span>
        <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${getEnvironmentBadgeClass(APP_ENV)}`}>
          {APP_ENV}
        </span>
      </div>
    </footer>
  );
}
