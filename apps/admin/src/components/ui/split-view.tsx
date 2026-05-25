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
  return (
    <div
      className={[
        `lg:grid lg:grid-cols-${columns} lg:items-start lg:gap-4`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}
