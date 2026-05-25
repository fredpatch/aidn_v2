import { useContext, useRef, useState } from "react";
import { CheckCircle2, Clock, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  closePreliminaryPhase,
  downloadDossierDocument,
  inviteFirstMeeting,
  invitePreliminaryMeeting,
  publishPreEvaluationForm,
  recordFirstMeeting,
  recordPreEvalDgReturn,
  recordPreliminaryMeeting,
  sendPreEvalToDg,
  uploadClosureCourrier,
  type AdminDossierDetail,
} from "@/lib/api/dossiers.api";
import { ApiError } from "@/lib/api/client";
import { AuthContext } from "@/contexts/AuthContext";
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
  preliminaryStatusLabels,
} from "./dossier-detail.helpers";

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

export function PreliminaryActionPanel({
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

    const previewWindow = window.open("about:blank", "_blank");
    setIsSubmitting(true);
    setActionError("");
    try {
      const { blob, fileName } = await downloadDossierDocument(
        dossierId,
        annotatedReturnDocumentId,
      );
      const url = URL.createObjectURL(blob);
      const targetWindow =
        previewWindow && !previewWindow.closed
          ? previewWindow
          : window.open("about:blank", "_blank");

      if (!targetWindow) {
        window.alert(
          "Impossible d'ouvrir l'aperçu. Autorisez les fenêtres contextuelles pour consulter le document.",
        );
        URL.revokeObjectURL(url);
        return;
      }

      targetWindow.document.title = fileName;
      targetWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      previewWindow?.close();
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
