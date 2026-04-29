import { BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const cardHoverClass = 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/70 dark:hover:shadow-slate-950/30';

interface ChartPlaceholderCardProps {
  title: string;
  description?: string;
  height?: number;
  readyFor?: string;
}

export function ChartPlaceholderCard({
  title,
  description,
  height = 200,
  readyFor,
}: ChartPlaceholderCardProps): React.JSX.Element {
  return (
    <Card className={`h-full ${cardHoverClass}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground"
          style={{ height }}
          role="img"
          aria-label={`Emplacement du graphique : ${title}`}
        >
          <BarChart2 className="mb-2 h-8 w-8 opacity-40" aria-hidden="true" />
          <p className="px-4 text-center text-xs">
            Zone graphique
            {readyFor ? <span className="mt-0.5 block text-xs opacity-70">Prévue pour {readyFor}</span> : null}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
