import type { DgCircuitTask } from "@/lib/api/dg-circuit";

import { timelineStepStyles } from "./constants";
import { formatDate } from "./formatters";

export function CourrierTimeline({
  task,
}: {
  task: DgCircuitTask;
}): React.JSX.Element {
  const signedByDg = !!(
    task.annotatedReturnDocumentId ||
    task.returnedFromDgAt ||
    task.returnedAt ||
    task.processedAt
  );
  const steps = [
    { label: "Recu", date: task.submittedAt, done: !!task.submittedAt },
    {
      label: "En circuit DG",
      date: task.transmittedAt,
      done: !!task.transmittedAt,
    },
    {
      label: "Signe DG",
      date: task.processedAt ?? task.returnedFromDgAt ?? task.returnedAt,
      done: signedByDg,
    },
  ];

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const styles = step.done
          ? timelineStepStyles.completed
          : timelineStepStyles.pending;
        return (
          <li key={i} className="flex items-start gap-3">
            <div
              className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${styles.indicator}`}
            />
            <div>
              <p className={`text-sm ${styles.label}`}>{step.label}</p>
              {step.date ? (
                <p className="text-xs text-muted-foreground">
                  {formatDate(step.date)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
