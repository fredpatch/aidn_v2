import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminFormalRequestPhase,
  type AdminDossierDetail,
  type AdminFormalRequestPhaseState,
  type AdminOmaPhase,
  type OmaPhaseKey,
} from "@/lib/api/dossiers.api";
import { extractError } from "@/lib/utils/error";
import { PHASE_ORDER, phaseKeyLabels } from "./dossier-detail.labels";
import {
  PhaseStatusBadge,
  Section,
} from "./dossier-detail.helpers";
import { FormalRequestPhaseChecklist } from "./FormalRequestPhaseChecklist";
import { FormalRequestPhaseWorkspace } from "./FormalRequestPhaseWorkspace";
import { PreliminaryActionPanel } from "./PreliminaryPhaseWorkspace";
import { PreliminaryPhaseChecklist } from "./PreliminaryPhaseChecklist";
import { getFormalRequestProgress } from "./formal-request-progress.helpers";
import { getPreliminaryProgress } from "./preliminary-progress.helpers";

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
          "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
          isSelected
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-transparent hover:bg-muted/60",
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
  onNavigateToTab,
}: {
  detail: AdminDossierDetail;
  dossierId: string;
  onRefresh: () => void;
  onNavigateToTab?: (tab: string) => void;
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
  const [formalState, setFormalState] =
    useState<AdminFormalRequestPhaseState | null>(null);
  const [isFormalLoading, setIsFormalLoading] = useState(false);
  const [formalError, setFormalError] = useState("");

  const loadFormalPhase = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (showLoading) setIsFormalLoading(true);
      setFormalError("");
      try {
        const nextState = await getAdminFormalRequestPhase(dossierId);
        setFormalState(nextState);
        return nextState;
      } catch (err) {
        setFormalError(extractError(err, "Impossible de charger la phase 2"));
        setFormalState(null);
        throw err;
      } finally {
        if (showLoading) setIsFormalLoading(false);
      }
    },
    [dossierId],
  );

  useEffect(() => {
    if (selectedKey !== "formal_request") return;

    let cancelled = false;

    const loadSelectedFormalPhase = async () => {
      setIsFormalLoading(true);
      setFormalError("");
      try {
        const nextState = await getAdminFormalRequestPhase(dossierId);
        if (!cancelled) setFormalState(nextState);
      } catch (err) {
        if (!cancelled) {
          setFormalError(extractError(err, "Impossible de charger la phase 2"));
          setFormalState(null);
        }
      } finally {
        if (!cancelled) setIsFormalLoading(false);
      }
    };

    void loadSelectedFormalPhase();

    return () => {
      cancelled = true;
    };
  }, [dossierId, selectedKey]);

  // ── Left column ─────────────────────────────────────────────────────────────

  const stepperCard = (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Phases OMA</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <ol className="space-y-0.5">
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
      </CardContent>
    </Card>
  );

  const prelim = detail.preliminary;
  const progress =
    selectedKey === "preliminary" && prelim
      ? getPreliminaryProgress(prelim.phase)
      : null;
  const formalProgress =
    selectedKey === "formal_request"
      ? getFormalRequestProgress(formalState)
      : null;

  const progressionCard =
    progress && prelim ? (
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Progression phase active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {progress.doneCount} / {progress.totalCount}
            </span>{" "}
            étapes
          </p>
          {progress.currentStep ? (
            <p className="text-xs text-muted-foreground">
              En cours :{" "}
              <span className="text-foreground">
                {progress.currentStep.label}
              </span>
            </p>
          ) : null}
          <PreliminaryPhaseChecklist phase={prelim.phase} compact />
        </CardContent>
      </Card>
    ) : selectedKey === "formal_request" ? (
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Progression phase active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          {isFormalLoading ? (
            <p className="text-xs text-muted-foreground">
              Chargement de la progression...
            </p>
          ) : formalError ? (
            <p className="text-xs text-red-600">{formalError}</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {formalProgress?.doneCount ?? 0} /{" "}
                  {formalProgress?.totalCount ?? 7}
                </span>{" "}
                étapes
              </p>
              {formalProgress?.currentStep ? (
                <p className="text-xs text-muted-foreground">
                  En cours :{" "}
                  <span className="text-foreground">
                    {formalProgress.currentStep.label}
                  </span>
                </p>
              ) : null}
              <FormalRequestPhaseChecklist state={formalState} compact />
            </>
          )}
        </CardContent>
      </Card>
    ) : (
      <Card>
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground">
            Progression détaillée à venir pour cette phase.
          </p>
        </CardContent>
      </Card>
    );

  // ── Right workspace ──────────────────────────────────────────────────────────

  const workspace =
    selectedKey === "preliminary" ? (
      <Section title="Phase préliminaire">
        <PreliminaryActionPanel
          dossierId={dossierId}
          detail={detail}
          onRefresh={onRefresh}
        />
      </Section>
    ) : selectedKey === "formal_request" ? (
      <FormalRequestPhaseWorkspace
        dossierId={dossierId}
        error={formalError}
        isLoading={isFormalLoading}
        onRefresh={onRefresh}
        onRefreshPhase={() => loadFormalPhase({ showLoading: false })}
        onStateChange={setFormalState}
        onNavigateToTab={onNavigateToTab}
        phaseRecord={byKey.get("formal_request")}
        state={formalState}
      />
    ) : (
      <PhaseWorkspacePlaceholder
        phaseKey={selectedKey}
        phase={byKey.get(selectedKey)}
      />
    );

  return (
    <div className="lg:grid lg:grid-cols-[1fr_2fr] lg:items-start lg:gap-4">
      <div className="space-y-3">
        {stepperCard}
        {progressionCard}
      </div>
      <div>{workspace}</div>
    </div>
  );
}
