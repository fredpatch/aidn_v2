import { useContext, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Info,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, SkeletonCard } from "@/components/states";
import {
  closePreliminaryPhase,
  downloadDossierDocument,
  getDossier,
  inviteFirstMeeting,
  invitePreliminaryMeeting,
  publishPreEvaluationForm,
  recordFirstMeeting,
  recordPreEvalDgReturn,
  recordPreliminaryMeeting,
  sendPreEvalToDg,
  uploadClosureCourrier,
  type AdminDossierDetail,
  type AdminMeetingSummary,
  type DossierStatus,
  type DossierType,
  type OmaPhaseKey,
  type PreliminaryStatus,
} from "@/lib/api/dossiers.api";
import { ApiError } from "@/lib/api/client";
import { AuthContext } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/auth/permissions";

const dossierTypeLabels: Record<DossierType, string> = {
  oma_recognition: "Certificat de reconnaissance OMA",
  oma_approval: "Certificat d'agrément OMA",
  oma_renewal: "Renouvellement de Certificat OMA",
  oma_modification: "Modification de Certificat OMA",
};

const dossierStatusLabels: Record<DossierStatus, string> = {
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

const phaseKeyLabels: Record<OmaPhaseKey, string> = {
  preliminary: "Phase 1 - Préliminaire",
  formal_request: "Phase 2 - Demande formelle",
  document_evaluation: "Phase 3 - Évaluation approfondie",
  inspection: "Phase 4 - Inspection / R3",
  delivery: "Phase 5 - Délivrance",
};

const phaseStatusLabels: Record<string, string> = {
  not_started: "Non démarrée",
  in_progress: "En cours",
  waiting_postulant: "Attente postulant",
  waiting_dg: "Attente DG",
  waiting_meeting: "Attente réunion",
  ready_to_close: "Prête à clore",
  closed: "Clôturée",
  suspended: "Suspendue",
};

const preliminaryStatusLabels: Record<PreliminaryStatus, string> = {
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

const PHASE_ORDER: OmaPhaseKey[] = [
  "preliminary",
  "formal_request",
  "document_evaluation",
  "inspection",
  "delivery",
];

function formatDate(value?: string): string {
  if (!value) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function Section({
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

function DefinitionGrid({
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

function Field({
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

function Note({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function PhaseStatusBadge({ status }: { status: string }): React.JSX.Element {
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

function MeetingCard({
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

function ActionError({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <XCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function WaitingState({
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

function InviteMeetingForm({
  title,
  buttonLabel,
  isSubmitting,
  error,
  onSubmit,
}: {
  title: string;
  buttonLabel: string;
  isSubmitting: boolean;
  error: string;
  onSubmit: (payload: {
    scheduledAt?: string;
    location?: string;
    notes?: string;
  }) => void;
}): React.JSX.Element {
  const [scheduledAt, setScheduledAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      scheduledAt: scheduledAt || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="form-scheduled-at" className="text-xs">
            Date prévue (optionnel)
          </Label>
          <Input
            id="form-scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="form-location" className="text-xs">
            Lieu (optionnel)
          </Label>
          <Input
            id="form-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Salle de réunion, adresse…"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="form-notes" className="text-xs">
          Notes (optionnel)
        </Label>
        <Textarea
          id="form-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="text-sm"
        />
      </div>
      {error ? <ActionError message={error} /> : null}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            En cours…
          </>
        ) : (
          buttonLabel
        )}
      </Button>
    </form>
  );
}

function RecordMeetingForm({
  title,
  buttonLabel,
  fileRequired,
  showVisibleToPostulant,
  isSubmitting,
  error,
  onSubmit,
}: {
  title: string;
  buttonLabel: string;
  fileRequired: boolean;
  showVisibleToPostulant?: boolean;
  isSubmitting: boolean;
  error: string;
  onSubmit: (formData: FormData) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [visibleToPostulant, setVisibleToPostulant] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const fd = new FormData();
    if (file) fd.append("file", file);
    if (notes.trim()) fd.append("notes", notes.trim());
    if (showVisibleToPostulant)
      fd.append("visibleToPostulant", String(visibleToPostulant));
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {title}
      </p>
      <div className="space-y-1">
        <Label htmlFor="form-file" className="text-xs">
          Compte rendu{" "}
          {fileRequired ? (
            <span className="text-red-500">*</span>
          ) : (
            "(optionnel)"
          )}
        </Label>
        <Input
          id="form-file"
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          required={fileRequired}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="form-record-notes" className="text-xs">
          Notes (optionnel)
        </Label>
        <Textarea
          id="form-record-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="text-sm"
        />
      </div>
      {showVisibleToPostulant ? (
        <div className="flex items-center gap-2">
          <input
            id="form-visible-postulant"
            type="checkbox"
            className="h-4 w-4"
            checked={visibleToPostulant}
            onChange={(e) => setVisibleToPostulant(e.target.checked)}
          />
          <Label htmlFor="form-visible-postulant" className="text-xs">
            Rendre le compte rendu visible au postulant
          </Label>
        </div>
      ) : null}
      {error ? <ActionError message={error} /> : null}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            En cours…
          </>
        ) : (
          buttonLabel
        )}
      </Button>
    </form>
  );
}

function SendToDgPanel({
  isSubmitting,
  error,
  onSubmit,
}: {
  isSubmitting: boolean;
  error: string;
  onSubmit: () => void;
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        Mettre en circuit officiel le formulaire de pré-évaluation
      </p>
      <p className="text-sm text-muted-foreground">
        Imprimez le formulaire, placez-le dans le circuit physique DG/parapheur,
        puis marquez-le comme mis en circuit.
      </p>
      {error ? <ActionError message={error} /> : null}
      <Button
        type="button"
        size="sm"
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            En cours…
          </>
        ) : (
          "Marquer mis en circuit"
        )}
      </Button>
    </div>
  );
}

function RecordDgReturnForm({
  isSubmitting,
  error,
  onSubmit,
}: {
  isSubmitting: boolean;
  error: string;
  onSubmit: (formData: FormData) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [returnedAt, setReturnedAt] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    const fd = new FormData();
    if (file) fd.append("file", file);
    if (returnedAt) fd.append("returnedAt", returnedAt);
    if (notes.trim()) fd.append("notes", notes.trim());
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        Enregistrer le retour DG (document annoté)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="dg-file" className="text-xs">
            Document retourné par le DG <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dg-file"
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            required
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dg-returned-at" className="text-xs">
            Date de retour (optionnel)
          </Label>
          <Input
            id="dg-returned-at"
            type="date"
            value={returnedAt}
            onChange={(e) => setReturnedAt(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="dg-notes" className="text-xs">
          Notes (optionnel)
        </Label>
        <Textarea
          id="dg-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="text-sm"
        />
      </div>
      {error ? <ActionError message={error} /> : null}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            En cours…
          </>
        ) : (
          "Enregistrer le retour DG"
        )}
      </Button>
    </form>
  );
}

function UploadClosureCourrierForm({
  isSubmitting,
  error,
  onSubmit,
}: {
  isSubmitting: boolean;
  error: string;
  onSubmit: (formData: FormData) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    if (title.trim()) fd.append("title", title.trim());
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        Téléverser le courrier de clôture (optionnel)
      </p>
      <p className="text-sm text-muted-foreground">
        Document de clôture de la phase préliminaire - sera visible au
        postulant.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="closure-file" className="text-xs">
            Courrier de clôture <span className="text-red-500">*</span>
          </Label>
          <Input
            id="closure-file"
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            required
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="closure-title" className="text-xs">
            Intitulé (optionnel)
          </Label>
          <Input
            id="closure-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Courrier de clôture - Phase préliminaire"
            className="h-8 text-sm"
          />
        </div>
      </div>
      {error ? <ActionError message={error} /> : null}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            En cours…
          </>
        ) : (
          "Téléverser le courrier de clôture"
        )}
      </Button>
    </form>
  );
}

function PreliminaryActionPanel({
  dossierId,
  detail,
  onRefresh,
}: {
  dossierId: string;
  detail: AdminDossierDetail;
  onRefresh: () => void;
}): React.JSX.Element {
  const auth = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const { preliminary } = detail;
  if (!preliminary) {
    return (
      <Note>
        Phase préliminaire non initialisée. Elle démarrera automatiquement à la
        première action.
      </Note>
    );
  }

  const { phase, firstMeeting, preliminaryMeeting } = preliminary;
  const ps = phase.preliminaryStatus;
  const isClosed = ps === "preliminary_closed";
  const user = auth?.user ?? null;
  const canManageMeetings = hasPermission(user, "MEETING_MANAGE");
  const canPublishDocuments = hasPermission(user, "DOCUMENT_UPLOAD_INTERNAL");
  const canHandlePreEvalDgCircuit = hasPermission(
    user,
    "PRE_EVAL_DG_CIRCUIT_HANDLE",
  );
  const canConsultPreEvalDgReturn = hasPermission(
    user,
    "PRE_EVAL_DG_RETURN_CONSULT",
  );
  const annotatedReturnDocumentId = phase.preEvaluationDgAnnotatedDocumentId;
  const hasAnnotatedReturn = Boolean(annotatedReturnDocumentId);

  const runAction = async (action: () => Promise<unknown>) => {
    setIsSubmitting(true);
    setActionError("");
    try {
      await action();
      onRefresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.";
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadAnnotatedReturn = async () => {
    if (!annotatedReturnDocumentId) return;

    setIsSubmitting(true);
    setActionError("");
    try {
      const { blob, fileName } = await downloadDossierDocument(
        dossierId,
        annotatedReturnDocumentId,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.";
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <DefinitionGrid>
        <Field label="Statut préliminaire">
          {ps ? (
            <Badge variant="secondary">{preliminaryStatusLabels[ps]}</Badge>
          ) : (
            <Badge variant="outline">Non initialisé</Badge>
          )}
        </Field>
        <Field label="Phase statut">
          <PhaseStatusBadge status={phase.status} />
        </Field>
        {phase.startedAt ? (
          <Field label="Démarrée le">{formatDate(phase.startedAt)}</Field>
        ) : null}
        {phase.closedAt ? (
          <Field label="Clôturée le">{formatDate(phase.closedAt)}</Field>
        ) : null}
      </DefinitionGrid>

      {firstMeeting ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Première réunion
          </p>
          <MeetingCard meeting={firstMeeting} />
        </div>
      ) : null}

      {preliminaryMeeting ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Réunion préliminaire
          </p>
          <MeetingCard meeting={preliminaryMeeting} />
        </div>
      ) : null}

      {isClosed ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>
            Phase préliminaire clôturée. La phase de demande formelle est
            désormais active.
          </p>
        </div>
      ) : null}

      {!isClosed ? (
        <div className="rounded-md border bg-muted/20 p-4">
          {ps === null || ps === "preliminary_started" ? (
            canManageMeetings ? (
              <InviteMeetingForm
                title="Planifier la première réunion de contact"
                buttonLabel="Planifier la réunion"
                isSubmitting={isSubmitting}
                error={actionError}
                onSubmit={(payload) =>
                  runAction(() => inviteFirstMeeting(dossierId, payload))
                }
              />
            ) : (
              <WaitingState>
                En attente de planification par l'équipe DN.
              </WaitingState>
            )
          ) : ps === "first_meeting_invited" ? (
            canManageMeetings ? (
              <RecordMeetingForm
                title="Enregistrer la tenue de la première réunion"
                buttonLabel="Enregistrer la réunion"
                fileRequired={false}
                showVisibleToPostulant
                isSubmitting={isSubmitting}
                error={actionError}
                onSubmit={(fd) =>
                  runAction(() => recordFirstMeeting(dossierId, fd))
                }
              />
            ) : (
              <WaitingState>
                En attente d'enregistrement de la première réunion par l'équipe
                DN.
              </WaitingState>
            )
          ) : ps === "first_meeting_held" ? (
            canPublishDocuments ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Rendre le formulaire de pré-évaluation disponible
                </p>
                <p className="text-sm text-muted-foreground">
                  Le formulaire configuré dans les paramètres (Modèles de
                  documents) sera mis à disposition du postulant dans son espace
                  portail.
                </p>
                {actionError ? <ActionError message={actionError} /> : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() =>
                    runAction(() => publishPreEvaluationForm(dossierId))
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      En cours…
                    </>
                  ) : (
                    "Rendre le formulaire disponible"
                  )}
                </Button>
              </div>
            ) : (
              <WaitingState>
                En attente de publication du formulaire de pre-evaluation.
              </WaitingState>
            )
          ) : ps === "pre_eval_form_available" ? (
            <WaitingState>
              En attente de soumission du formulaire par le postulant.
            </WaitingState>
          ) : ps === "pre_eval_form_submitted" ? (
            canHandlePreEvalDgCircuit ? (
              <SendToDgPanel
                isSubmitting={isSubmitting}
                error={actionError}
                onSubmit={() => runAction(() => sendPreEvalToDg(dossierId, {}))}
              />
            ) : (
              <WaitingState>
                Formulaire soumis. En attente de traitement par la réception, le
                bureau courrier ou le secrétariat DG.
              </WaitingState>
            )
          ) : ps === "pre_eval_sent_to_dg" ? (
            canHandlePreEvalDgCircuit ? (
              <RecordDgReturnForm
                isSubmitting={isSubmitting}
                error={actionError}
                onSubmit={(fd) =>
                  runAction(() => recordPreEvalDgReturn(dossierId, fd))
                }
              />
            ) : (
              <WaitingState>
                Formulaire transmis au circuit officiel. En attente du retour
                annoté scanné par la réception, le bureau courrier ou le
                secrétariat DG.
              </WaitingState>
            )
          ) : ps === "pre_eval_dg_decision_recorded" &&
            canManageMeetings &&
            hasAnnotatedReturn ? (
            <div className="space-y-4">
              {canConsultPreEvalDgReturn ? (
                <div className="space-y-3">
                  {actionError ? <ActionError message={actionError} /> : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => void downloadAnnotatedReturn()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le retour DG annoté
                  </Button>
                </div>
              ) : null}
              <InviteMeetingForm
                title="Planifier la réunion préliminaire"
                buttonLabel="Planifier la réunion préliminaire"
                isSubmitting={isSubmitting}
                error={actionError}
                onSubmit={(payload) =>
                  runAction(() => invitePreliminaryMeeting(dossierId, payload))
                }
              />
            </div>
          ) : ps === "pre_eval_dg_decision_recorded" ? (
            <div className="space-y-3">
              {canConsultPreEvalDgReturn && hasAnnotatedReturn ? (
                <>
                  {actionError ? <ActionError message={actionError} /> : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => void downloadAnnotatedReturn()}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le retour DG annoté
                  </Button>
                </>
              ) : hasAnnotatedReturn ? (
                <WaitingState>
                  Retour DG annoté enregistré. Document non accessible à votre
                  profil.
                </WaitingState>
              ) : (
                <WaitingState>
                  En attente du scan annoté DG avant la reprise DN.
                </WaitingState>
              )}
            </div>
          ) : ps === "preliminary_meeting_invited" ? (
            canManageMeetings ? (
              <RecordMeetingForm
                title="Enregistrer la tenue de la réunion préliminaire"
                buttonLabel="Enregistrer la réunion"
                fileRequired={false}
                isSubmitting={isSubmitting}
                error={actionError}
                onSubmit={(fd) =>
                  runAction(() => recordPreliminaryMeeting(dossierId, fd))
                }
              />
            ) : (
              <WaitingState>
                En attente de tenue de la réunion préliminaire par l'équipe DN.
              </WaitingState>
            )
          ) : ps === "preliminary_meeting_held" ? (
            <div className="space-y-4">
              {canPublishDocuments ? (
                <UploadClosureCourrierForm
                  isSubmitting={isSubmitting}
                  error={actionError}
                  onSubmit={(fd) =>
                    runAction(() => uploadClosureCourrier(dossierId, fd))
                  }
                />
              ) : null}
              {hasPermission(user, "PHASE_CLOSE") ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Clôturer la phase préliminaire
                  </p>
                  <p className="text-sm text-muted-foreground">
                    La réunion préliminaire a été tenue. Vous pouvez clôturer
                    directement ou téléverser un courrier de clôture avant de
                    confirmer.
                  </p>
                  {actionError && !canPublishDocuments ? (
                    <ActionError message={actionError} />
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={isSubmitting}
                    onClick={() => setCloseDialogOpen(true)}
                  >
                    Clôturer la phase préliminaire
                  </Button>
                </div>
              ) : null}
              {!canPublishDocuments && !hasPermission(user, "PHASE_CLOSE") ? (
                <WaitingState>
                  Phase préliminaire en attente de clôture.
                </WaitingState>
              ) : null}
            </div>
          ) : ps === "preliminary_ready_to_close" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Courrier de clôture téléversé. La phase peut être clôturée.
              </p>
              {hasPermission(user, "PHASE_CLOSE") ? (
                <div className="space-y-3">
                  {actionError ? <ActionError message={actionError} /> : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    disabled={isSubmitting}
                    onClick={() => setCloseDialogOpen(true)}
                  >
                    Clôturer la phase préliminaire
                  </Button>
                </div>
              ) : (
                <WaitingState>
                  Phase préliminaire en attente de clôture.
                </WaitingState>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la clôture</DialogTitle>
            <DialogDescription>
              Clôturer la phase préliminaire est irréversible. La phase de
              demande formelle sera activée automatiquement. Confirmez-vous ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setCloseDialogOpen(false);
                void runAction(() => closePreliminaryPhase(dossierId));
              }}
            >
              {isSubmitting ? "Clôture en cours…" : "Confirmer la clôture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhasesOverview({
  phases,
}: {
  phases: AdminDossierDetail["phases"];
}): React.JSX.Element {
  const byKey = new Map(phases.map((p) => [p.phaseKey, p]));

  return (
    <ol className="space-y-2 text-sm">
      {PHASE_ORDER.map((key, index) => {
        const phase = byKey.get(key);
        return (
          <li
            key={key}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
          >
            <span className="font-medium">
              {index + 1}. {phaseKeyLabels[key]}
            </span>
            {phase ? (
              <PhaseStatusBadge status={phase.status} />
            ) : (
              <Badge variant="outline">Non initialisée</Badge>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function DossierDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminDossierDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setError("");
    try {
      setDetail(await getDossier(id));
    } catch {
      setError("Impossible de charger le dossier.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="page-container">
        <EmptyState
          message={error || "Dossier introuvable."}
          action={
            <Button asChild variant="outline">
              <Link to="/dossiers">Retour aux dossiers DN</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { dossier, phases, preliminary } = detail;

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
            <Link to="/dossiers">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour aux dossiers DN
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="page-title">
              {dossier.dossierNumber ?? dossier.id}
            </h1>
            <Badge variant="outline">
              {dossierStatusLabels[dossier.status] ?? dossier.status}
            </Badge>
          </div>
          <p className="page-subtitle">
            {dossier.organization?.canonicalName ?? "Organisme non renseigné"} -{" "}
            {dossier.postulant?.fullName ?? "Postulant non renseigné"}
          </p>
        </div>
        <div className="grid gap-1 text-left text-sm sm:text-right">
          <span className="text-muted-foreground">Type</span>
          <span className="font-semibold">
            {dossierTypeLabels[dossier.dossierType]}
          </span>
          <span className="text-muted-foreground">Ouverture</span>
          <span className="font-semibold">{formatDate(dossier.openedAt)}</span>
        </div>
      </div>

      <Section title="Vue d'ensemble">
        <DefinitionGrid>
          <Field label="Référence">{dossier.dossierNumber ?? dossier.id}</Field>
          <Field label="Type">{dossierTypeLabels[dossier.dossierType]}</Field>
          <Field label="Statut">
            <Badge variant="outline">
              {dossierStatusLabels[dossier.status] ?? dossier.status}
            </Badge>
          </Field>
          <Field label="Organisme">
            {dossier.organization?.canonicalName ?? "Non renseigné"}
          </Field>
          <Field label="Postulant">
            {dossier.postulant?.fullName ?? "Non renseigné"}
          </Field>
          <Field label="Date d'ouverture">{formatDate(dossier.openedAt)}</Field>
          {dossier.closedAt ? (
            <Field label="Date de clôture">
              {formatDate(dossier.closedAt)}
            </Field>
          ) : null}
        </DefinitionGrid>
        {dossier.organization?.legalAddress || dossier.organization?.email ? (
          <Note>
            {[
              dossier.organization.legalAddress &&
                `Adresse : ${dossier.organization.legalAddress}`,
              dossier.organization.email &&
                `Email : ${dossier.organization.email}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Note>
        ) : null}
      </Section>

      <Section title="Phases OMA">
        <PhasesOverview phases={phases} />
      </Section>

      {preliminary !== null ? (
        <Section title="Phase préliminaire - Actions">
          <PreliminaryActionPanel
            dossierId={dossier.id}
            detail={detail}
            onRefresh={() => void load()}
          />
        </Section>
      ) : null}
    </div>
  );
}
