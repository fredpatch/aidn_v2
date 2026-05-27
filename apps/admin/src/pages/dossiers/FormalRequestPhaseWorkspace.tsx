import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AdminFormalRequestPhaseState,
  AdminFormalRequestRequirement,
  AdminFormalRequestSubmission,
  AdminOmaPhase,
  FormalRequirementLevel,
  FormalSubmissionStatus,
} from "@/lib/api/dossiers.api";
import {
  ActionError,
  DefinitionGrid,
  Field,
  Note,
  PhaseStatusBadge,
  WaitingState,
  formatDate,
} from "./dossier-detail.helpers";
import { FormalRequestPhaseChecklist } from "./FormalRequestPhaseChecklist";
import { hasFormalDgDecision } from "./formal-request-progress.helpers";

const formalStatusLabels: Record<string, string> = {
  formal_not_started: "Non démarrée",
  formal_waiting_request: "En attente du courrier formel",
  formal_request_received: "Demande formelle reçue",
  formal_documents_tracking: "Suivi documentaire",
  formal_sent_to_dg: "Mise en circuit DG",
  formal_dg_returned: "Retour DG enregistré",
  formal_dg_decision_recorded: "Décision DG enregistrée",
  formal_meeting_invited: "Réunion formelle programmée",
  formal_meeting_held: "Réunion formelle tenue",
  formal_recevability_recorded: "Recevabilité enregistrée",
  formal_ready_to_close: "Prête à clôturer",
  formal_requires_correction: "Correction demandée",
  formal_closed: "Clôturée",
};

const requirementLevelLabels: Record<FormalRequirementLevel, string> = {
  gate: "Bloquant",
  expected: "Attendu",
  optional: "Optionnel",
  conditional: "Conditionnel",
};

const submissionStatusLabels: Record<string, string> = {
  missing: "Manquant",
  submitted: "Déposé",
  under_review: "En revue",
  validated: "Validé",
  requires_correction: "Correction demandée",
  rejected: "Rejeté",
  replaced: "Remplacé",
  not_applicable: "Non applicable",
};

const sourceLabels: Record<string, string> = {
  portal_upload: "Téléversé par le postulant",
  physical_deposit: "Dépôt physique",
  internal_scan: "Scan interne",
};

const meetingStatusLabels: Record<string, string> = {
  planned: "Programmée",
  invited: "Programmée",
  held: "Tenue",
  postponed: "Reportée",
  cancelled: "Annulée",
};

function formatOptionalDate(value?: string): string {
  return value ? formatDate(value) : "Non renseigné";
}

function StatusBadge({
  status,
}: {
  status: FormalSubmissionStatus;
}): React.JSX.Element {
  const label = submissionStatusLabels[status] ?? status;

  if (status === "validated") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {label}
      </Badge>
    );
  }

  if (status === "requires_correction" || status === "rejected") {
    return <Badge variant="destructive">{label}</Badge>;
  }

  if (status === "submitted" || status === "under_review") {
    return <Badge variant="secondary">{label}</Badge>;
  }

  return <Badge variant="outline">{label}</Badge>;
}

function AvailabilityBadge({
  available,
  availableLabel,
  missingLabel,
}: {
  available: boolean;
  availableLabel: string;
  missingLabel: string;
}): React.JSX.Element {
  if (available) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {availableLabel}
      </Badge>
    );
  }
  return <Badge variant="secondary">{missingLabel}</Badge>;
}

function LevelBadge({
  level,
}: {
  level: FormalRequirementLevel;
}): React.JSX.Element {
  if (level === "gate") return <Badge variant="destructive">Bloquant</Badge>;
  return <Badge variant="outline">{requirementLevelLabels[level] ?? level}</Badge>;
}

function latestActiveSubmission(
  requirement: AdminFormalRequestRequirement,
): AdminFormalRequestSubmission | null {
  const byNewest = [...requirement.submissions].sort((a, b) => {
    const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return bTime - aTime;
  });
  const active = byNewest.filter((submission) => submission.status !== "replaced");
  return active[0] ?? byNewest[0] ?? null;
}

function isSentToDgStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return [
    "formal_sent_to_dg",
    "formal_dg_returned",
    "formal_dg_decision_recorded",
    "formal_meeting_invited",
    "formal_meeting_held",
    "formal_recevability_recorded",
    "formal_ready_to_close",
    "formal_requires_correction",
    "formal_closed",
  ].includes(status);
}

function isDgReturnedStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return [
    "formal_dg_returned",
    "formal_dg_decision_recorded",
    "formal_meeting_invited",
    "formal_meeting_held",
    "formal_recevability_recorded",
    "formal_ready_to_close",
    "formal_requires_correction",
    "formal_closed",
  ].includes(status);
}

function nextActionLabel(state: AdminFormalRequestPhaseState): string {
  if (!state.gate.exists) {
    return "En attente du dépôt de la demande formelle par le postulant.";
  }
  const sentToDg = isSentToDgStatus(state.phase.formalRequestStatus);
  if (!sentToDg) {
    return "Demande formelle reçue. Le traitement du circuit DG doit être effectué depuis Courriers officiels.";
  }
  const dgReturned = isDgReturnedStatus(state.phase.formalRequestStatus);
  if (!dgReturned) {
    return "Demande formelle en circuit DG/parapheur. En attente du retour scanné.";
  }
  if (hasFormalDgDecision(state)) {
    return "Retour DG enregistré. DN peut maintenant programmer la réunion formelle.";
  }
  return "Consultez l'état de la phase pour déterminer la prochaine action.";
}

function StepLine({
  done,
  label,
}: {
  done: boolean;
  label: string;
}): React.JSX.Element {
  return (
    <li className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </li>
  );
}

function RequirementRow({
  requirement,
}: {
  requirement: AdminFormalRequestRequirement;
}): React.JSX.Element {
  const activeSubmission = latestActiveSubmission(requirement);
  const history = requirement.submissions.filter(
    (submission) => submission.status === "replaced",
  );
  const source = activeSubmission?.source
    ? sourceLabels[activeSubmission.source] ?? activeSubmission.source
    : "Non renseignée";

  return (
    <li className="border-b py-3 last:border-b-0">
      <div className="grid gap-3 text-sm lg:grid-cols-[minmax(0,2fr)_auto_auto_minmax(8rem,1fr)] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {requirement.label}
            </span>
            {requirement.isRepeatable ? <Badge variant="outline">Multiple</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {requirement.formCode ?? requirement.code}
          </p>
        </div>
        <LevelBadge level={requirement.requirementLevel} />
        <StatusBadge status={requirement.status} />
        <div className="text-xs text-muted-foreground">
          <div>Dernier dépôt : {formatOptionalDate(activeSubmission?.uploadedAt)}</div>
          <div>Source : {source}</div>
        </div>
      </div>

      {history.length > 0 ? (
        <details className="mt-2 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            Dépôts remplacés ({history.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {history.map((submission) => (
              <li key={submission.submissionId}>
                Remplacé - {formatOptionalDate(submission.uploadedAt)} -{" "}
                {submission.source
                  ? sourceLabels[submission.source] ?? submission.source
                  : "Source non renseignée"}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}

function WorkflowSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function FormalRequestPhaseWorkspace({
  error,
  isLoading,
  onRefreshPhase: _onRefreshPhase,
  onStateChange: _onStateChange,
  phaseRecord,
  state,
}: {
  dossierId: string;
  error: string;
  isLoading: boolean;
  onRefresh: () => void;
  onRefreshPhase: () => Promise<AdminFormalRequestPhaseState>;
  onStateChange: (state: AdminFormalRequestPhaseState) => void;
  phaseRecord?: AdminOmaPhase;
  state: AdminFormalRequestPhaseState | null;
}): React.JSX.Element {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Chargement de la phase 2...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <ActionError message={error || "Impossible de charger la phase 2"} />;
  }

  if (!state) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Aucune donnée de phase 2 disponible
        </CardContent>
      </Card>
    );
  }

  const formalStatus = state.phase.formalRequestStatus
    ? formalStatusLabels[state.phase.formalRequestStatus] ??
      state.phase.formalRequestStatus
    : "Non renseigné";
  const gateSource = state.gate.source
    ? sourceLabels[state.gate.source] ?? state.gate.source
    : "Non renseignée";
  const sentToDg = isSentToDgStatus(state.phase.formalRequestStatus);
  const dgReturned = isDgReturnedStatus(state.phase.formalRequestStatus);
  const dgDecisionRecorded = hasFormalDgDecision(state);
  const meetingProgrammed = Boolean(state.meeting);
  const meetingHeld = state.meeting?.status === "held";

  return (
    <div className="space-y-4">
      <DefinitionGrid>
        <Field label="Statut demande formelle">{formalStatus}</Field>
        <Field label="Phase statut">
          <PhaseStatusBadge status={state.phase.status} />
        </Field>
        <Field label="Démarrée le">{formatOptionalDate(phaseRecord?.startedAt)}</Field>
        <Field label="Clôturée le">{formatOptionalDate(phaseRecord?.closedAt)}</Field>
        <Field label="Circuit DG">
          {sentToDg ? "Mis en circuit" : "Non mis en circuit"}
        </Field>
        <Field label="Retour DG">
          {dgReturned ? "Scan enregistré" : "Non enregistré"}
        </Field>
      </DefinitionGrid>

      {/* ── 1. Courrier formel ──────────────────────────────────────────────── */}
      <WorkflowSection
        title="Courrier formel"
        icon={<FileText className="h-4 w-4" aria-hidden="true" />}
      >
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge
              available={state.gate.exists}
              availableLabel="Présent"
              missingLabel="Manquant"
            />
            {sentToDg ? (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              >
                Mis en circuit DG
              </Badge>
            ) : state.gate.exists ? (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
              >
                En attente du circuit DG
              </Badge>
            ) : null}
          </div>

          {!state.gate.exists ? (
            <div className="space-y-2">
              <WaitingState>
                En attente du dépôt de la demande formelle par le postulant.
              </WaitingState>
              <Note>
                Le postulant doit téléverser la demande formelle depuis son portail.
                Si le courrier est reçu physiquement, il devra être traité depuis le
                circuit des courriers officiels.
              </Note>
            </div>
          ) : (
            <div className="space-y-2">
              {state.gate.source === "portal_upload" ? (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Demande formelle reçue via le portail.
                </p>
              ) : null}
              <DefinitionGrid>
                <Field label="Source">{gateSource}</Field>
                <Field label="Date réception">
                  {formatOptionalDate(state.gate.receivedAt)}
                </Field>
              </DefinitionGrid>
              <Note>
                Le courrier formel conditionne la suite du circuit. Les autres
                pièces sont suivies sans bloquer automatiquement la progression DG.
              </Note>
            </div>
          )}
        </div>
      </WorkflowSection>

      {/* ── 2. Circuit DG (lecture seule) ───────────────────────────────────── */}
      <WorkflowSection
        title="Circuit DG"
        icon={<Send className="h-4 w-4" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <ol className="grid gap-2 sm:grid-cols-2">
            <StepLine done={!sentToDg} label="Non mis en circuit" />
            <StepLine done={sentToDg} label="Mis en circuit DG" />
            <StepLine done={dgReturned} label="Retour DG scanné" />
            <StepLine done={dgDecisionRecorded} label="Décision DG enregistrée" />
          </ol>
          <Note>
            Le circuit DG est traité depuis l'espace Courriers officiels.
          </Note>
        </div>
      </WorkflowSection>

      {/* ── 3. Réunion formelle ─────────────────────────────────────────────── */}
      <WorkflowSection
        title="Réunion formelle"
        icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
      >
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meetingProgrammed ? "secondary" : "outline"}>
              {state.meeting
                ? meetingStatusLabels[state.meeting.status] ?? state.meeting.status
                : "Non programmée"}
            </Badge>
            <AvailabilityBadge
              available={meetingHeld}
              availableLabel="Tenue"
              missingLabel="Non tenue"
            />
            <AvailabilityBadge
              available={Boolean(state.meeting?.reportDocumentId)}
              availableLabel="Compte rendu disponible"
              missingLabel="Compte rendu non joint"
            />
          </div>
          <DefinitionGrid>
            <Field label="Date prévue">
              {formatOptionalDate(state.meeting?.scheduledAt)}
            </Field>
            <Field label="Lieu">{state.meeting?.location ?? "Non renseigné"}</Field>
          </DefinitionGrid>
        </div>
      </WorkflowSection>

      {/* ── 4. Documents de demande formelle ────────────────────────────────── */}
      <WorkflowSection
        title="Documents de demande formelle"
        icon={<FileCheck2 className="h-4 w-4" aria-hidden="true" />}
      >
        <div className="space-y-3">
          <div className="rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {state.progress.completionRate}% documentaire
            </span>{" "}
            - {state.progress.submitted}/{state.progress.totalTracked} pièces
            déposées, {state.progress.validated} validées. Suivi uniquement,
            sans blocage automatique du circuit DG.
          </div>
          {state.requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune exigence documentaire disponible.
            </p>
          ) : (
            <ul>
              {state.requirements.map((requirement) => (
                <RequirementRow
                  key={requirement.requirementId}
                  requirement={requirement}
                />
              ))}
            </ul>
          )}
        </div>
      </WorkflowSection>

      {/* ── 5. Recevabilité et clôture ──────────────────────────────────────── */}
      <WorkflowSection
        title="Recevabilité et clôture"
        icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
      >
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge
              available={Boolean(state.closure.recevabilityCourrierDocumentId)}
              availableLabel="Courrier de recevabilité joint"
              missingLabel="Recevabilité non jointe"
            />
            <AvailabilityBadge
              available={Boolean(state.closure.phaseClosureCourrierDocumentId)}
              availableLabel="Courrier de clôture Phase II joint"
              missingLabel="Clôture non jointe"
            />
            <AvailabilityBadge
              available={state.phase.canClosePhase || state.closure.canClosePhase}
              availableLabel="Clôture possible"
              missingLabel="Clôture non disponible"
            />
          </div>
          <FormalRequestPhaseChecklist state={state} />
        </div>
      </WorkflowSection>

      {/* ── Statut / prochaine action ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-900 dark:text-slate-100">
            {nextActionLabel(state)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
