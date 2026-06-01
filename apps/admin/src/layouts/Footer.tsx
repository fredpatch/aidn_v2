import { APP_ENV, APP_NAME, APP_VERSION } from '../config/app';
import { getEnvironmentBadgeClass } from './footer.helpers';

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
