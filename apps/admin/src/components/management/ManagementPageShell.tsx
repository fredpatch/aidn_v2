import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ManagementPageShellProps {
  header: ReactNode;
  toolbar: ReactNode;
  filterPanel?: ReactNode;
  bulkActionBar?: ReactNode;
  table: ReactNode;
  pagination?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ManagementPageShell({
  header,
  toolbar,
  filterPanel,
  bulkActionBar,
  table,
  pagination,
  children,
  className,
}: ManagementPageShellProps): React.JSX.Element {
  return (
    <div className={cn('space-y-4', className)}>
      {header}
      {toolbar}
      {filterPanel}
      {bulkActionBar}
      {table}
      {pagination}
      {children}
    </div>
  );
}
