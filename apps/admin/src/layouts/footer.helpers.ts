export function getEnvironmentBadgeClass(environment: string): string {
  const classes: Record<string, string> = {
    local: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600',
    development: 'bg-primary/10 text-primary ring-primary/30 dark:bg-primary/15 dark:text-primary dark:ring-primary/40',
    staging: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-700',
    production: 'bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-700',
  };

  return classes[environment] ?? classes.local;
}
