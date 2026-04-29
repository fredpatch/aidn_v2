interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps): React.JSX.Element {
  return (
    <div className="surface animate-pulse rounded-lg p-4" role="status" aria-label="Chargement">
      <div className="mb-4 h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 rounded bg-slate-200 dark:bg-slate-700"
            style={{ width: `${index % 2 === 0 ? 85 : 62}%` }}
          />
        ))}
      </div>
    </div>
  );
}
