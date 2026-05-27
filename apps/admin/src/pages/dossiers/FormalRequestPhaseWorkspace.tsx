import { useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/contexts/AuthContext";
import type {
  AdminFormalRequestPhaseState,
  AdminOmaPhase,
  FormalRequirementLevel,
  FormalSubmissionStatus,
} from "@/lib/api/dossiers.api";
import { hasPermission } from "@/lib/auth/permissions";
import {
  ActionError,
  DefinitionGrid,
  Field,
  Note,
  PhaseStatusBadge,
  WaitingState,
  formatDate,
} from "./dossier-detail.helpers";
import {
  getFormalRequestVisibility,
  hasFormalDgDecision,
} from "./formal-request-progress.helpers";
import {
  CloseFormalRequestPhaseDialog,
  InviteFormalMeetingDialog,
  MarkFormalMeetingHeldDialog,
  UploadFormalMeetingReportDialog,
} from "./formal-request-dialogs";

type DialogKey =
  | "invite_formal_meeting"
  | "mark_meeting_held"
  | "upload_meeting_report"
  | "close_phase";

const formalStatusLabels: Record<string, string> = {
  formal_not_started: "Non démarrée",
  formal_waiting_request: "En attente du courrier formel",
  formal_request_received: "Demande formelle reçue",
  formal_documents_tracking: "Suivi documentaire",
  formal_sent_to_dg: "Mise en circuit DG",
  formal_dg_returned: "Retour DG / Décision disponible",
  formal_dg_decision_recorded: "Retour DG / Décision disponible",
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="rounded-md border bg-muted/10 p-3">{children}</div>
    </div>
  );
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

export function FormalRequestPhaseWorkspace({
  dossierId,
  error,
  isLoading,
  onRefreshPhase: _onRefreshPhase,
  onStateChange,
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
  const auth = useContext(AuthContext);
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);

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

  const user = auth?.user ?? null;
  const canManageMeetings = hasPermission(user, "MEETING_MANAGE");
  const canPublishDocuments = hasPermission(user, "DOCUMENT_UPLOAD_INTERNAL");
  const canPhaseClose = hasPermission(user, "PHASE_CLOSE");

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
  const isClosed = state.phase.formalRequestStatus === "formal_closed";
  const startedAtDisplay = phaseRecord?.startedAt ?? state.gate.receivedAt;

  const visibility = getFormalRequestVisibility(state);

  // dgReturned and dgDecisionRecorded are now equivalent for Phase 2 (scan = evidence)
  const circuitOfficielStatus =
    dgReturned || dgDecisionRecorded
      ? "Retour DG scanné"
      : sentToDg
        ? "Mis en circuit"
        : "Non mis en circuit";

  const correctionsCount = state.requirements.filter(
    (requirement) => requirement.status === "requires_correction",
  ).length;
  const gateRequirement = state.requirements.find(
    (requirement) => requirement.requirementLevel === "gate",
  );
  const correctionRequirements = state.requirements.filter(
    (requirement) =>
      requirement.status === "requires_correction" &&
      requirement.requirementLevel !== "gate",
  );

  let nextActionContent: React.ReactNode;

  // Priority order (highest first):
  // closed → canClose → report upload → mark held → gate/circuit/DG checks → invite meeting → else
  if (isClosed) {
    nextActionContent = (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        Phase 2 — Demande formelle clôturée.
      </div>
    );
  } else if (state.phase.canClosePhase || state.closure.canClosePhase) {
    nextActionContent = canPhaseClose ? (
      <Button
        variant="destructive"
        onClick={() => setOpenDialog("close_phase")}
      >
        Clôturer la Phase 2
      </Button>
    ) : (
      <WaitingState>
        Phase 2 prête à clôturer — en attente de la clôture par le responsable.
      </WaitingState>
    );
  } else if (meetingHeld && !state.meeting?.reportDocumentId) {
    nextActionContent = canPublishDocuments ? (
      <Button onClick={() => setOpenDialog("upload_meeting_report")}>
        Joindre le compte rendu de réunion formelle
      </Button>
    ) : (
      <WaitingState>Réunion tenue. En attente du compte rendu de réunion.</WaitingState>
    );
  } else if (meetingProgrammed && !meetingHeld) {
    // Meeting scheduled but not yet held
    nextActionContent = canManageMeetings ? (
      <Button onClick={() => setOpenDialog("mark_meeting_held")}>
        Marquer la réunion formelle comme tenue
      </Button>
    ) : (
      <WaitingState>En attente de la tenue de la réunion formelle.</WaitingState>
    );
  } else if (!state.gate.exists) {
    nextActionContent = (
      <WaitingState>
        En attente du dépôt de la demande formelle par le postulant.
      </WaitingState>
    );
  } else if (!sentToDg) {
    nextActionContent = (
      <WaitingState>
        Demande formelle reçue. Circuit DG à traiter depuis l'espace Courriers officiels.
      </WaitingState>
    );
  } else if (!dgReturned) {
    nextActionContent = (
      <WaitingState>
        Demande formelle en circuit officiel. En attente du retour DG.
      </WaitingState>
    );
  } else if ((state.phase.canInviteFormalMeeting || dgDecisionRecorded) && !meetingProgrammed) {
    // DG return scan = decision evidence — invite meeting (only if no meeting exists yet)
    nextActionContent = canManageMeetings ? (
      <Button onClick={() => setOpenDialog("invite_formal_meeting")}>
        Planifier la réunion formelle
      </Button>
    ) : (
      <WaitingState>
        Retour DG disponible. Réunion formelle à programmer par le responsable.
      </WaitingState>
    );
  } else {
    // Meeting report uploaded, awaiting recevability/closure courrier
    nextActionContent = (
      <WaitingState>
        Réunion tenue et compte rendu joint. En attente du courrier de
        recevabilité ou de clôture pour finaliser la phase.
      </WaitingState>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Phase 2 - Demande formelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DefinitionGrid>
            <Field label="Statut demande formelle">{formalStatus}</Field>
            <Field label="Phase statut">
              <PhaseStatusBadge status={state.phase.status} />
            </Field>
            <Field label="Démarrée le">
              {formatOptionalDate(startedAtDisplay)}
            </Field>
            <Field label="Clôturée le">
              {formatOptionalDate(phaseRecord?.closedAt)}
            </Field>
            <Field label="Circuit officiel">{circuitOfficielStatus}</Field>
            <Field label="Retour DG">
              {dgReturned ? "Enregistré" : "Non enregistré"}
            </Field>
          </DefinitionGrid>

          <DetailSection title="Courrier formel">
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
                    Le postulant doit téléverser la demande formelle depuis son
                    portail. Si le courrier est reçu physiquement, il devra être
                    traité depuis le circuit des courriers officiels.
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
          </DetailSection>

          {/* ── Réunion formelle + Documents — progressive reveal ──────────────── */}
          {visibility.showFormalMeeting || visibility.showSupportingDocuments ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibility.showFormalMeeting ? (
                <DetailSection title="Réunion formelle">
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
                      {visibility.showMeetingReport ? (
                        <AvailabilityBadge
                          available={Boolean(state.meeting?.reportDocumentId)}
                          availableLabel="Compte rendu disponible"
                          missingLabel="Compte rendu non joint"
                        />
                      ) : null}
                    </div>
                    {state.meeting ? (
                      <DefinitionGrid>
                        <Field label="Date prévue">
                          {formatOptionalDate(state.meeting.scheduledAt)}
                        </Field>
                        <Field label="Lieu">
                          {state.meeting.location ?? "Non renseigné"}
                        </Field>
                      </DefinitionGrid>
                    ) : null}
                  </div>
                </DetailSection>
              ) : null}

              {visibility.showSupportingDocuments ? (
                <DetailSection title="Documents de demande formelle">
                  <div className="space-y-3 text-sm">
                    <div className="rounded-md bg-muted/30 p-3">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">
                          {state.progress.totalTracked} pièces suivies
                        </span>
                        {" · "}
                        {state.progress.submitted} déposée
                        {state.progress.submitted !== 1 ? "s" : ""}
                        {" · "}
                        {state.progress.validated} validée
                        {state.progress.validated !== 1 ? "s" : ""}
                        {correctionsCount > 0 ? (
                          <span className="ml-1 font-medium text-destructive">
                            {" · "}
                            {correctionsCount} correction
                            {correctionsCount !== 1 ? "s" : ""} demandée
                            {correctionsCount !== 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Suivi documentaire uniquement, sans blocage automatique du
                        circuit officiel.
                      </p>
                    </div>

                    {gateRequirement ? (
                      <div className="border-b pb-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Demande formelle
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{gateRequirement.label}</span>
                          <LevelBadge level={gateRequirement.requirementLevel} />
                          <StatusBadge status={gateRequirement.status} />
                        </div>
                      </div>
                    ) : null}

                    {correctionRequirements.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Corrections demandées
                        </p>
                        <ul className="space-y-2">
                          {correctionRequirements.map((requirement) => (
                            <li
                              key={requirement.requirementId}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <span>{requirement.label}</span>
                              <StatusBadge status={requirement.status} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Aucune correction demandée pour le moment.
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Consulter le détail dans l'onglet Documents.
                    </p>
                  </div>
                </DetailSection>
              ) : null}
            </div>
          ) : null}

          {/* ── Clôture et recevabilité — progressive reveal ────────────────── */}
          {visibility.showClosureEvidence ? (
            <DetailSection title="Clôture et recevabilité">
              <div className="flex flex-wrap gap-2 text-sm">
                <AvailabilityBadge
                  available={Boolean(state.closure.recevabilityCourrierDocumentId)}
                  availableLabel="Courrier de recevabilité joint"
                  missingLabel="Courrier de recevabilité non joint"
                />
                <AvailabilityBadge
                  available={Boolean(state.closure.phaseClosureCourrierDocumentId)}
                  availableLabel="Courrier de clôture joint"
                  missingLabel="Courrier de clôture non joint"
                />
              </div>
            </DetailSection>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prochaine action
              </CardTitle>
            </CardHeader>
            <CardContent>{nextActionContent}</CardContent>
          </Card>
        </CardContent>
      </Card>

      <InviteFormalMeetingDialog
        open={openDialog === "invite_formal_meeting"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={(nextState) => {
          setOpenDialog(null);
          onStateChange(nextState);
        }}
      />
      <MarkFormalMeetingHeldDialog
        open={openDialog === "mark_meeting_held"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={(nextState) => {
          setOpenDialog(null);
          onStateChange(nextState);
        }}
      />
      <UploadFormalMeetingReportDialog
        open={openDialog === "upload_meeting_report"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={(nextState) => {
          setOpenDialog(null);
          onStateChange(nextState);
        }}
      />
      <CloseFormalRequestPhaseDialog
        open={openDialog === "close_phase"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={(nextState) => {
          setOpenDialog(null);
          onStateChange(nextState);
        }}
      />
    </>
  );
}
