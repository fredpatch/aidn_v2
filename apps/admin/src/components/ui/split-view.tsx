function parseColumns(columns: string): string {
  return columns.replace(/^\[|\]$/g, '').replace(/_/g, ' ');
}

export function SplitView({
  left,
  right,
  columns = '[2fr_3fr]',
  className,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  columns?: string;
  className?: string;
}) {
  const cols = parseColumns(columns);
  return (
    <div
      className={[
        'lg:grid lg:grid-cols-[var(--split-cols)] lg:items-start lg:gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--split-cols': cols } as React.CSSProperties}
    >
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
