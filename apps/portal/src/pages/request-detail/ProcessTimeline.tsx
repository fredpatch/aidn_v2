import { CheckCircle2 } from "lucide-react";

import type { PortalDossierDetail } from "../../lib/api/dossiers";
import type { PortalRequest } from "../../lib/api/requests";
import { buildProcessSteps } from "./helpers";

export function ProcessTimeline({
  request,
  isSubmitted,
  dossierDetail,
}: {
  request: PortalRequest;
  isSubmitted: boolean;
  dossierDetail: PortalDossierDetail | null;
}): React.JSX.Element {
  const steps = buildProcessSteps(request, isSubmitted, dossierDetail);

  return (
    <ol className="flex flex-col gap-2">
      {steps.map((step) => (
        <li key={step.id} className="process-step">
          <div className="mt-0.5 flex w-5 flex-shrink-0 flex-col items-center">
            {step.state === "done" ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                <CheckCircle2
                  size={12}
                  className="text-white"
                  aria-hidden="true"
                />
              </span>
            ) : step.state === "active" ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-white">
                <span className="h-2 w-2 rounded-full bg-slate-900" />
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-200 bg-white" />
            )}
          </div>
          <div className="min-w-0 pb-4">
            <p
              className={[
                "text-sm font-medium",
                step.state === "done"
                  ? "text-emerald-700"
                  : step.state === "active"
                    ? "text-slate-900"
                    : "text-slate-400",
              ].join(" ")}
            >
              {step.label}
            </p>
            {step.subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500">{step.subtitle}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
