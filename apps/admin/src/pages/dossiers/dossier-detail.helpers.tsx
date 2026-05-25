import { CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AdminMeetingSummary,
  DossierStatus,
  DossierType,
  OmaPhaseKey,
  PreliminaryStatus,
} from "@/lib/api/dossiers.api";

export const dossierTypeLabels: Record<DossierType, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

export const dossierStatusLabels: Record<DossierStatus, string> = {
  opened: "Ouvert",
  preliminary_phase: "Phase préliminaire",
  formal_request_phase: "Demande formelle",
  document_evaluation_phase: "Évaluation documents",
  inspection_phase: "Inspection",
  delivery_phase: "Délivrance",
  closed: "Clôturé",
  suspended: "Suspendu",
  cancelled: "Annulé",
};

export const phaseKeyLabels: Record<OmaPhaseKey, string> = {
  preliminary: "Phase 1 - Préliminaire",
  formal_request: "Phase 2 - Demande formelle",
  document_evaluation: "Phase 3 - Évaluation approfondie",
  inspection: "Phase 4 - Inspection / R3",
  delivery: "Phase 5 - Délivrance",
};

export const phaseStatusLabels: Record<string, string> = {
  not_started: "Non démarrée",
  in_progress: "En cours",
  waiting_postulant: "Attente postulant",
  waiting_dg: "Attente DG",
  waiting_meeting: "Attente réunion",
  ready_to_close: "Prête à clore",
  closed: "Clôturée",
  suspended: "Suspendue",
};

export const preliminaryStatusLabels: Record<PreliminaryStatus, string> = {
  preliminary_not_started: "Non démarrée",
  preliminary_started: "Démarrée",
  first_meeting_invited: "Première réunion planifiée",
  first_meeting_held: "Première réunion tenue",
  pre_eval_form_available: "Formulaire disponible",
  pre_eval_form_submitted: "Formulaire soumis",
  pre_eval_sent_to_dg: "Envoyé au DG",
  pre_eval_dg_returned: "Retour DG reçu",
  pre_eval_dg_decision_recorded: "Décision DG enregistrée",
  preliminary_meeting_invited: "Réunion préliminaire planifiée",
  preliminary_meeting_held: "Réunion préliminaire tenue",
  preliminary_ready_to_close: "Prête à clore",
  preliminary_closed: "Clôturée",
};

export const PHASE_ORDER: OmaPhaseKey[] = [
  "preliminary",
  "formal_request",
  "document_evaluation",
  "inspection",
  "delivery",
];

export function formatDate(value?: string): string {
  if (!value) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function PhaseStatusBadge({
  status,
}: {
  status: string;
}): React.JSX.Element {
  const label = phaseStatusLabels[status] ?? status;
  if (status === "closed") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        {label}
      </Badge>
    );
  }
  if (
    status === "in_progress" ||
    status === "waiting_postulant" ||
    status === "waiting_meeting"
  ) {
    return <Badge variant="secondary">{label}</Badge>;
  }
  if (status === "suspended") {
    return <Badge variant="destructive">{label}</Badge>;
  }
  return <Badge variant="outline">{label}</Badge>;
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DefinitionGrid({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </dl>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-slate-900 dark:text-slate-100">
        {children}
      </dd>
    </div>
  );
}

export function Note({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function MeetingCard({
  meeting,
}: {
  meeting: AdminMeetingSummary;
}): React.JSX.Element {
  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm">
      <p className="font-medium">{meeting.title}</p>
      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="inline">Statut : </dt>
          <dd className="inline">{meeting.status}</dd>
        </div>
        {meeting.scheduledAt ? (
          <div>
            <dt className="inline">Date : </dt>
            <dd className="inline">{formatDate(meeting.scheduledAt)}</dd>
          </div>
        ) : null}
        {meeting.location ? (
          <div>
            <dt className="inline">Lieu : </dt>
            <dd className="inline">{meeting.location}</dd>
          </div>
        ) : null}
        {meeting.reportDocumentId ? (
          <div className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            <span>Compte rendu joint</span>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function ActionError({
  message,
}: {
  message: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <XCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function WaitingState({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 text-sm text-muted-foreground">
      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
