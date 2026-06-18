import type { DgCircuitTask } from "@/lib/api/dg-circuit.api";

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
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3">
          <div
            className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
              step.done
                ? "border-emerald-500 bg-emerald-500"
                : "border-slate-300 bg-white dark:bg-slate-950"
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${step.done ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
            >
              {step.label}
            </p>
            {step.date ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(step.date)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
