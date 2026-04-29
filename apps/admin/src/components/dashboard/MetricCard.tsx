import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendIndicator, type TrendDirection } from './TrendIndicator';

const cardHoverClass = 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 dark:hover:shadow-slate-950/30';

export interface MetricItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: TrendDirection;
  trendValue?: string;
  positiveIsGood?: boolean;
}

interface MetricCardProps extends MetricItem {
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  positiveIsGood = true,
  isLoading = false,
}: MetricCardProps): React.JSX.Element {
  if (isLoading) {
    return (
      <Card role="status" aria-label="Chargement de l’indicateur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-1 h-7 w-20" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardHoverClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon ? <span className="text-muted-foreground" aria-hidden="true">{icon}</span> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle || (trend && trendValue) ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
            {trend && trendValue ? (
              <TrendIndicator direction={trend} value={trendValue} positiveIsGood={positiveIsGood} />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
