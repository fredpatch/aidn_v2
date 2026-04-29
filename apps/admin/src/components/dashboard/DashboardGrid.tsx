import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GridCols = 1 | 2 | 3 | 4;

interface DashboardGridProps {
  cols?: GridCols;
  children: ReactNode;
  className?: string;
}

const colsMap: Record<GridCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function DashboardGrid({ cols = 2, children, className }: DashboardGridProps): React.JSX.Element {
  return <div className={cn('grid gap-4', colsMap[cols], className)}>{children}</div>;
}
