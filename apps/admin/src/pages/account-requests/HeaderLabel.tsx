import type { ComponentType, ReactNode } from 'react';

export function HeaderLabel({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-4 w-4" aria-hidden={true} />
      {children}
    </span>
  );
}
