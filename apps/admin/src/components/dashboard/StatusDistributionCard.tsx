import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { StatusDistributionItem } from './types';

const cardHoverClass = 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 dark:hover:shadow-slate-950/30';

interface StatusDistributionCardProps {
  title?: string;
  items: StatusDistributionItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function StatusDistributionCard({
  title = 'Répartition des statuts',
  items,
  isLoading = false,
  emptyMessage = 'Aucune donnée disponible.',
}: StatusDistributionCardProps): React.JSX.Element {
  return (
    <Card className={`h-full ${cardHoverClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-4" role="status" aria-label="Chargement de la répartition des statuts">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
          <ul className="space-y-4" role="list">
            {items.map((item) => (
              <li key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={item.badgeVariant ?? 'secondary'}>{item.label}</Badge>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {item.count} <span className="text-xs">({item.percentage}%)</span>
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" aria-label={`${item.label}: ${item.percentage}%`} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
