import type { ReactNode } from 'react';

interface DashboardSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({ title, description, children, className }: DashboardSectionProps): React.JSX.Element {
  return (
    <section className={className}>
      {title || description ? (
        <div className="mb-4">
          {title ? <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2> : null}
          {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
