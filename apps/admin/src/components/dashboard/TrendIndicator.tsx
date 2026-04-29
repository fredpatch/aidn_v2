import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';

interface TrendIndicatorProps {
  direction: TrendDirection;
  value: string;
  positiveIsGood?: boolean;
}

export function TrendIndicator({ direction, value, positiveIsGood = true }: TrendIndicatorProps): React.JSX.Element {
  const isPositive = positiveIsGood ? direction === 'up' : direction === 'down';
  const isNegative = positiveIsGood ? direction === 'down' : direction === 'up';

  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs font-medium',
        direction === 'neutral'
          ? 'text-muted-foreground'
          : isPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : isNegative
              ? 'text-red-600 dark:text-red-400'
              : 'text-muted-foreground',
      ].join(' ')}
      aria-label={`Trend: ${direction}, ${value}`}
    >
      {direction === 'up' ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : null}
      {direction === 'down' ? <TrendingDown className="h-3 w-3" aria-hidden="true" /> : null}
      {direction === 'neutral' ? <Minus className="h-3 w-3" aria-hidden="true" /> : null}
      {value}
    </span>
  );
}
