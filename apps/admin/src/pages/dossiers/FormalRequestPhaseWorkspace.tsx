import { useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/contexts/AuthContext";
import type {
  AdminFormalRequestPhaseState,
  AdminFormalRequestRequirement,
  AdminOmaPhase,
  FormalSubmissionStatus,
} from "@/lib/api/dossiers.api";
import { hasPermission } from "@/lib/auth/permissions";
import {
  ActionError,
  DefinitionGrid,
  Field,
  MeetingCard,
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
  UploadFormalMeetingReportDialog,
} from "./formal-request-dialogs";

type DialogKey =
  | "invite_formal_meeting"
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


const submissionStatusLabels: Record<string, string> = {
  missing: "Manquant",
  submitted: "Déposé",
  under_review: "En revue",
  validated: "Validé",
  requires_correction: "Correction demandée",
  incomplete: "Incomplet",
  rejected: "Rejeté",
  replaced: "Remplacé",
  not_applicable: "Non applicable",
};

const sourceLabels: Record<string, string> = {
  portal_upload: "Téléversé par le postulant",
  physical_deposit: "Dépôt physique",
  internal_scan: "Scan interne",
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

  if (status === "incomplete") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      >
        {label}
      </Badge>
    );
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
  onNavigateToTab,
  phaseRecord,
  state,
}: {
  dossierId: string;
  error: string;
  isLoading: boolean;
  onRefresh: () => void;
  onRefreshPhase: () => Promise<AdminFormalRequestPhaseState>;
  onStateChange: (state: AdminFormalRequestPhaseState) => void;
  onNavigateToTab?: (tab: string) => void;
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
  const formalMeetingForCard = state.meeting
    ? {
        ...state.meeting,
        meetingType: "formal_meeting",
        title: "Réunion formelle",
        reportDocumentId: state.meeting.reportDocumentId ?? undefined,
      }
    : null;

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
  const omaApprovalFormReq: AdminFormalRequestRequirement | undefined = state.requirements.find(
    (r) => r.code === "oma_approval_form",
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
    // Phase 1 pattern: compte rendu upload = meeting held — no separate "mark held" step
    nextActionContent = canPublishDocuments ? (
      <Button onClick={() => setOpenDialog("upload_meeting_report")}>
        Joindre le compte rendu de réunion formelle
      </Button>
    ) : (
      <WaitingState>
        Réunion programmée. En attente du compte rendu de réunion formelle.
      </WaitingState>
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
    // Meeting report uploaded but canClosePhase=false — documents are the blocker
    const hasMissingDocs = state.progress.missing > 0;
    const omaNotValidated = omaApprovalFormReq && omaApprovalFormReq.status !== "validated";
    if (hasMissingDocs || omaNotValidated) {
      nextActionContent = (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">
            Les pièces de demande formelle doivent être complétées avant clôture.
          </p>
          {onNavigateToTab ? (
            <Button size="sm" variant="outline" onClick={() => onNavigateToTab("documents")}>
              Voir les documents
            </Button>
          ) : null}
        </div>
      );
    } else {
      nextActionContent = (
        <WaitingState>Compte rendu joint. La phase peut être clôturée par la DN.</WaitingState>
      );
    }
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
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Réunion formelle
                  </p>
                  {formalMeetingForCard ? (
                    <MeetingCard meeting={formalMeetingForCard} />
                  ) : (
                    <div className="rounded-md border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">Réunion formelle</p>
                      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <div>
                          <dt className="inline">Statut : </dt>
                          <dd className="inline">Non programmée</dd>
                        </div>
                        <div>
                          <dt className="inline">Date prévue : </dt>
                          <dd className="inline">Non renseigné</dd>
                        </div>
                        <div>
                          <dt className="inline">Lieu : </dt>
                          <dd className="inline">Non renseigné</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
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
                        {state.progress.missing > 0 ? (
                          <span className="font-medium text-destructive">
                            {" · "}
                            {state.progress.missing} manquante
                            {state.progress.missing !== 1 ? "s" : ""}
                          </span>
                        ) : null}
                        {correctionsCount > 0 ? (
                          <span className="ml-1 font-medium text-destructive">
                            {" · "}
                            {correctionsCount} correction
                            {correctionsCount !== 1 ? "s" : ""} demandée
                            {correctionsCount !== 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </p>
                      {omaApprovalFormReq ? (
                        <p className="mt-1.5 text-xs text-foreground">
                          Formulaire{" "}
                          <span className="font-mono font-medium">
                            {omaApprovalFormReq.formCode ?? "DN-AIR-R2-3-F-E-010"}
                          </span>
                          {" : "}
                          <StatusBadge status={omaApprovalFormReq.status} />
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le détail des pièces et les actions de consultation sont disponibles dans l'onglet Documents.
                    </p>
                    {onNavigateToTab ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToTab("documents")}
                      >
                        Voir les documents
                      </Button>
                    ) : null}
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
        progress={state.progress}
        omaApprovalFormRequirement={omaApprovalFormReq}
        onSuccess={(nextState) => {
          setOpenDialog(null);
          onStateChange(nextState);
        }}
      />
    </>
  );
}
