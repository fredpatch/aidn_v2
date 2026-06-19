import { CheckCircle2, Circle, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminFormalRequestPhaseState } from "@/lib/api/dossiers";
import {
  getFormalRequestProgress,
  type FormalRequestStep,
} from "./formal-request-progress.helpers";

function getCompactSteps(steps: FormalRequestStep[]): FormalRequestStep[] {
  const currentIdx = steps.findIndex((step) => step.current);
  if (currentIdx === -1) return steps.filter((step) => step.done).slice(-3);
  const from = Math.max(0, currentIdx - 1);
  const to = Math.min(steps.length, currentIdx + 4);
  return steps.slice(from, to);
}

export function FormalRequestPhaseChecklist({
  state,
  compact = false,
}: {
  state: AdminFormalRequestPhaseState | null;
  compact?: boolean;
}): React.JSX.Element {
  const { steps } = getFormalRequestProgress(state);
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
