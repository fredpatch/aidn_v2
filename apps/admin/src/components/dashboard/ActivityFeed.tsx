import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityFeedItem } from './ActivityFeedItem';
import type { ActivityEvent } from './types';

const cardHoverClass = 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 dark:hover:shadow-slate-950/30';

interface ActivityFeedProps {
  items: ActivityEvent[];
  title?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
}

export function ActivityFeed({
  items,
  title = 'Activité récente',
  isLoading = false,
  emptyMessage = 'Aucune activité récente.',
  maxItems = 10,
}: ActivityFeedProps): React.JSX.Element {
  const visible = items.slice(0, maxItems);

  return (
    <Card className={`h-full ${cardHoverClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-3" role="status" aria-label="Chargement de l’activité">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12 shrink-0" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {visible.map((event) => (
              <ActivityFeedItem key={event.id} event={event} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
