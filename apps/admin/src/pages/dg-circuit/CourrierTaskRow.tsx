import { Badge } from "@/components/ui/badge";
import type { DgCircuitTask } from "@/lib/api/dg-circuit";

import { bucketStyle, sourceLabels } from "./constants";
import { formatDate } from "./formatters";
import { StatusBadge } from "./StatusBadge";

export function CourrierTaskRow({
  task,
  isSelected,
  onClick,
}: {
  task: DgCircuitTask;
  isSelected: boolean;
  onClick: () => void;
}): React.JSX.Element {
  const style = bucketStyle[task.bucket] ?? bucketStyle.to_transmit;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-md border border-l-4 bg-background p-3 text-left transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "border-primary ring-1 ring-primary"
          : `border-slate-200 dark:border-slate-800 ${style.accentBorder}`,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${style.iconBg}`}
          aria-hidden="true"
        >
          {style.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {sourceLabels[task.source] ?? task.source}
            </Badge>
          </div>
          <p className="truncate text-sm font-medium">
            {task.reference || task.subject}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {task.organizationName || task.applicantName || "Non renseigne"}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <p className="text-xs text-muted-foreground">
            {formatDate(task.submittedAt)}
          </p>
          <StatusBadge bucket={task.bucket} />
        </div>
      </div>
    </button>
  );
}
