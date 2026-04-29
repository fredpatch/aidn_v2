import { cn } from '@/lib/utils';

interface SplashProgressProps {
  className?: string;
}

export function SplashProgress({ className }: SplashProgressProps): React.JSX.Element {
  return (
    <div className={cn('w-full max-w-64 space-y-3', className)} aria-hidden="true">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div data-splash-progress-bar className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#009b4a,#f4e83a,#4d61a8,#40387f)]" />
      </div>
      <div className="flex justify-center gap-1.5">
        <span data-splash-dot className="h-1.5 w-1.5 rounded-full bg-primary/45" />
        <span data-splash-dot className="h-1.5 w-1.5 rounded-full bg-primary/65" />
        <span data-splash-dot className="h-1.5 w-1.5 rounded-full bg-primary" />
      </div>
    </div>
  );
}
