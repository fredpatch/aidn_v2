import { CheckCircle2, Circle, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminOmaPhase } from "@/lib/api/dossiers.api";
import { getPreliminaryProgress, type PreliminaryStep } from "./preliminary-progress.helpers";

function getCompactSteps(steps: PreliminaryStep[]): PreliminaryStep[] {
  const currentIdx = steps.findIndex((s) => s.current);
  if (currentIdx === -1) {
    // No current step: show the last 3 completed
    return steps.filter((s) => s.done).slice(-3);
  }
  // 1 step before current (last done) + current + 3 next pending
  const from = Math.max(0, currentIdx - 1);
  const to = Math.min(steps.length, currentIdx + 4);
  return steps.slice(from, to);
}

export function PreliminaryPhaseChecklist({
  phase,
  compact = false,
}: {
  phase: AdminOmaPhase;
  compact?: boolean;
}): React.JSX.Element {
  const { steps } = getPreliminaryProgress(phase);
  const visible = compact ? getCompactSteps(steps) : steps;

  return (
    <ol className={compact ? "space-y-0" : "space-y-0.5"}>
      {visible.map((step) => (
        <li
          key={step.key}
          className={cn(
            "flex items-start gap-2 rounded py-1 text-xs",
            compact ? "px-1" : "px-2 py-1.5 text-sm",
            step.current && "bg-primary/5",
          )}
        >
          {step.done ? (
            <CheckCircle2
              className={cn(
                "shrink-0 text-emerald-600",
                compact ? "mt-0.5 h-3 w-3" : "mt-0.5 h-4 w-4",
              )}
              aria-hidden="true"
            />
          ) : step.current ? (
            <MoveRight
              className={cn(
                "shrink-0 text-primary",
                compact ? "mt-0.5 h-3 w-3" : "mt-0.5 h-4 w-4",
              )}
              aria-hidden="true"
            />
          ) : (
            <Circle
              className={cn(
                "shrink-0 text-muted-foreground/40",
                compact ? "mt-0.5 h-3 w-3" : "mt-0.5 h-4 w-4",
              )}
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              step.done
                ? "text-muted-foreground line-through"
                : step.current
                  ? "font-medium text-primary"
                  : "text-muted-foreground",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
