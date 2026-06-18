import { RefreshCw } from "lucide-react";

import type { PortalDossierDetail } from "../../lib/api/dossiers";
import { dossierTypeLabels } from "./constants";
import { formalClosedLabel } from "./dossier.constants";
import { formatDate } from "./formatters";

type DossierOverviewPanelProps = {
  dossierDetail: PortalDossierDetail;
  dossierLoading: boolean;
  onRefreshDossier: () => void;
};

export function DossierOverviewPanel({
  dossierDetail,
  dossierLoading,
  onRefreshDossier,
}: DossierOverviewPanelProps): React.JSX.Element {
  return (
    <div className="grid gap-5">
      <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-3 field-readonly">
        <div>
          <dt>Référence dossier</dt>
          <dd className="font-mono">{dossierDetail.dossier.dossierNumber}</dd>
        </div>
        <div>
          <dt>Type de certification</dt>
          <dd>
            {dossierTypeLabels[dossierDetail.dossier.dossierType] ??
              dossierDetail.dossier.dossierType}
          </dd>
        </div>
        <div>
          <dt>Ouvert le</dt>
          <dd>{formatDate(dossierDetail.dossier.openedAt)}</dd>
        </div>
      </dl>

      <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3">
        {[
          {
            label: "Phase I — Préliminaire",
            done: dossierDetail.preliminary.status === "preliminary_closed",
            active: dossierDetail.preliminary.status !== "preliminary_closed",
          },
          {
            label: "Phase II — Demande formelle",
            done: dossierDetail.formalRequest?.portalLabel === formalClosedLabel,
            active:
              !!dossierDetail.formalRequest &&
              dossierDetail.formalRequest.portalLabel !== formalClosedLabel,
          },
          {
            label: "Phase III — Évaluation",
            done: ["inspection_phase", "delivery_phase", "closed"].includes(
              dossierDetail.dossier.status,
            ),
            active: dossierDetail.dossier.status === "document_evaluation_phase",
          },
        ].map((phase) => (
          <div
            key={phase.label}
            className={[
              "rounded-lg px-3 py-2 text-xs font-medium",
              phase.done
                ? "bg-emerald-50 text-emerald-700"
                : phase.active
                  ? "bg-sky-50 text-sky-800"
                  : "bg-white text-slate-400",
            ].join(" ")}
          >
            {phase.done ? (
              <span className="mr-1.5">✓</span>
            ) : phase.active ? (
              <span className="mr-1.5">→</span>
            ) : (
              <span className="mr-1.5 opacity-0">·</span>
            )}
            {phase.label}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-secondary py-1 text-xs"
          onClick={onRefreshDossier}
          disabled={dossierLoading}
        >
          <RefreshCw size={12} aria-hidden="true" />
          Actualiser
        </button>
      </div>
    </div>
  );
}
