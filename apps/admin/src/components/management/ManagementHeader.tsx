import type { ReactNode } from 'react';

interface ManagementHeaderProps {
  title: string;
  subtitle?: string;
  createSlot?: ReactNode;
  actionsSlot?: ReactNode;
}

export function ManagementHeader({ title, subtitle, createSlot, actionsSlot }: ManagementHeaderProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {createSlot || actionsSlot ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actionsSlot}
          {createSlot}
        </div>
      ) : null}
    </div>
  );
}
