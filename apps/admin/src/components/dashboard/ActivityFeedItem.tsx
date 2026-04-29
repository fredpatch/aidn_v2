import { Badge } from '@/components/ui/badge';
import type { ActivityEvent } from './types';

interface ActivityFeedItemProps {
  event: ActivityEvent;
}

export function ActivityFeedItem({ event }: ActivityFeedItemProps): React.JSX.Element {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      {event.icon ? (
        <span
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          {event.icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium">{event.label}</span>
          {event.badgeLabel ? (
            <Badge variant={event.badgeVariant ?? 'secondary'} className="shrink-0">
              {event.badgeLabel}
            </Badge>
          ) : null}
        </div>
        {event.description ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.description}</p> : null}
      </div>
      <time dateTime={event.timestamp} className="shrink-0 text-xs text-muted-foreground">
        {event.timestamp}
      </time>
    </li>
  );
}
