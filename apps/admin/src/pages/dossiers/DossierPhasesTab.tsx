import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDossierDetail, AdminOmaPhase, OmaPhaseKey } from "@/lib/api/dossiers.api";
import {
  PHASE_ORDER,
  PhaseStatusBadge,
  Section,
  phaseKeyLabels,
} from "./dossier-detail.helpers";
import { PreliminaryActionPanel } from "./PreliminaryPhaseWorkspace";

function PhaseStepperItem({
  phaseKey,
  index,
  phase,
  isSelected,
  onClick,
}: {
  phaseKey: OmaPhaseKey;
  index: number;
  phase?: AdminOmaPhase;
  isSelected: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <li>
      <button
        type="button"
        className={[
          "w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
          isSelected
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-transparent bg-muted/30 hover:bg-muted/60",
        ].join(" ")}
        onClick={onClick}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">
            {index + 1}. {phaseKeyLabels[phaseKey]}
          </span>
          {phase ? (
            <PhaseStatusBadge status={phase.status} />
          ) : (
            <Badge variant="outline">Non initialisée</Badge>
          )}
        </div>
      </button>
    </li>
  );
}

function PhaseWorkspacePlaceholder({
  phaseKey,
  phase,
}: {
  phaseKey: OmaPhaseKey;
  phase?: AdminOmaPhase;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{phaseKeyLabels[phaseKey]}</CardTitle>
          {phase ? <PhaseStatusBadge status={phase.status} /> : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Espace de travail à venir pour cette phase.
        </p>
      </CardContent>
    </Card>
  );
}

export function DossierPhasesTab({
  detail,
  dossierId,
  onRefresh,
}: {
  detail: AdminDossierDetail;
  dossierId: string;
  onRefresh: () => void;
}): React.JSX.Element {
  const { phases } = detail;
  const byKey = new Map(phases.map((p) => [p.phaseKey, p]));

  const [selectedKey, setSelectedKey] = useState<OmaPhaseKey>(() => {
    const inProgress = PHASE_ORDER.find(
      (key) => byKey.get(key)?.status === "in_progress",
    );
    if (inProgress) return inProgress;
    const anyStarted = PHASE_ORDER.find((key) => byKey.has(key));
    return anyStarted ?? "preliminary";
  });

  const stepper = (
    <ol className="space-y-1.5">
      {PHASE_ORDER.map((key, index) => (
        <PhaseStepperItem
          key={key}
          phaseKey={key}
          index={index}
          phase={byKey.get(key)}
          isSelected={selectedKey === key}
          onClick={() => setSelectedKey(key)}
        />
      ))}
    </ol>
  );

  const workspace =
    selectedKey === "preliminary" ? (
      <Section title="Phase préliminaire - Actions">
        <PreliminaryActionPanel
          dossierId={dossierId}
          detail={detail}
          onRefresh={onRefresh}
        />
      </Section>
    ) : (
      <PhaseWorkspacePlaceholder
        phaseKey={selectedKey}
        phase={byKey.get(selectedKey)}
      />
    );

  return (
    <div className="lg:grid lg:grid-cols-[1fr_2fr] lg:items-start lg:gap-4">
      <div>{stepper}</div>
      <div>{workspace}</div>
    </div>
  );
}
