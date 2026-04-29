interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps): React.JSX.Element {
  return (
    <div className="surface overflow-hidden rounded-lg" role="status" aria-label="Chargement du tableau">
      <div className="grid animate-pulse gap-px bg-slate-200 dark:bg-slate-800" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, index) => (
          <div key={`head-${index}`} className="bg-slate-100 p-3 dark:bg-slate-800">
            <div className="h-3 w-2/3 rounded bg-slate-300 dark:bg-slate-700" />
          </div>
        ))}
        {Array.from({ length: rows * cols }).map((_, index) => (
          <div key={index} className="bg-white p-3 dark:bg-slate-900">
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
