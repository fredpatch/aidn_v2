import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RecentRecord } from './types';

const cardHoverClass = 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 dark:hover:shadow-slate-950/30';

interface RecentRecordsCardProps {
  title: string;
  records: RecentRecord[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRecordClick?: (record: RecentRecord) => void;
  viewAllHref?: string;
  viewAllLabel?: string;
  maxItems?: number;
}

export function RecentRecordsCard({
  title,
  records,
  isLoading = false,
  emptyMessage = 'Aucun suivi récent.',
  onRecordClick,
  viewAllHref,
  viewAllLabel = 'Tout voir',
  maxItems = 5,
}: RecentRecordsCardProps): React.JSX.Element {
  const visible = records.slice(0, maxItems);

  return (
    <Card className={`flex h-full flex-col ${cardHoverClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">{title}</CardTitle>
          {viewAllHref ? (
            <Button variant="ghost" size="sm" asChild>
              <a href={viewAllHref}>{viewAllLabel}</a>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <ul className="space-y-3" role="status" aria-label="Chargement des suivis">
            {Array.from({ length: maxItems }).map((_, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 shrink-0" />
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {visible.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => onRecordClick?.(record)}
                  disabled={!onRecordClick}
                  className={[
                    'flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0',
                    onRecordClick ? '-mx-1 cursor-pointer rounded px-1 transition-colors hover:bg-muted/50' : 'cursor-default',
                  ].join(' ')}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{record.title}</p>
                    {record.subtitle ? <p className="truncate text-xs text-muted-foreground">{record.subtitle}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {record.badgeLabel ? <Badge variant={record.badgeVariant ?? 'secondary'}>{record.badgeLabel}</Badge> : null}
                    {record.timestamp ? <span className="text-xs text-muted-foreground">{record.timestamp}</span> : null}
                    {onRecordClick ? <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
