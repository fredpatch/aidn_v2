import { cn } from '@/lib/utils';

interface BrandMarkProps {
  appName: string;
  tagline: string;
  subtitle: string;
  className?: string;
}

export function BrandMark({ appName, tagline, subtitle, className }: BrandMarkProps): React.JSX.Element {
  return (
    <div className={cn('flex flex-col items-center gap-4 text-center', className)} aria-label={`${appName} - ${tagline}`}>
      <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-border shadow-lg shadow-primary/20" aria-hidden="true">
        <img className="h-18 w-18 object-contain" src="/logo.png" alt="" />
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-slate-950 dark:text-white">{appName}</p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{tagline}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}
