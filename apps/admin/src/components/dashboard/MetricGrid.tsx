import { DashboardGrid } from './DashboardGrid';
import { MetricCard, type MetricItem } from './MetricCard';

interface MetricGridProps {
  metrics: MetricItem[];
  isLoading?: boolean;
  cols?: 2 | 3 | 4;
}

export function MetricGrid({ metrics, isLoading = false, cols = 4 }: MetricGridProps): React.JSX.Element | null {
  if (isLoading) {
    return (
      <DashboardGrid cols={cols}>
        {Array.from({ length: cols }).map((_, index) => (
          <MetricCard key={index} id={`metric-skeleton-${index}`} title="" value="" isLoading />
        ))}
      </DashboardGrid>
    );
  }

  if (metrics.length === 0) {
    return null;
  }

  return (
    <DashboardGrid cols={cols}>
      {metrics.map((metric) => (
        <MetricCard key={metric.id} {...metric} />
      ))}
    </DashboardGrid>
  );
}
