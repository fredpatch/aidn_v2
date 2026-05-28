import { useContext, useState } from "react";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  downloadDossierDocument,
  inviteFirstMeeting,
  invitePreliminaryMeeting,
  recordFirstMeeting,
  recordPreliminaryMeeting,
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
import {
  ClosePreliminaryDialog,
  InviteMeetingDialog,
  PublishPreEvalDialog,
  RecordDgReturnDialog,
  RecordMeetingDialog,
  SendToDgDialog,
  UploadClosureCourrierDialog,
} from "./preliminary-dialogs";

type DialogKey =
  | "invite_first"
  | "record_first"
  | "publish_pre_eval"
  | "send_to_dg"
  | "record_dg_return"
  | "invite_preliminary"
  | "record_preliminary"
  | "upload_closure"
  | "close_preliminary";

const EVIDENCE_LABELS: Record<string, string> = {
  firstMeetingReportDocumentId: "Compte rendu - 1ère réunion",
  preEvaluationTemplateDocumentId: "Formulaire pré-évaluation (modèle)",
  completedPreEvaluationDocumentId: "Formulaire pré-évaluation (soumis)",
  preEvaluationDgAnnotatedDocumentId: "Retour DG annoté",
  preliminaryMeetingReportDocumentId: "Compte rendu - réunion préliminaire",
  closureCourrierDocumentId: "Courrier de clôture phase I - optionnel",
};

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
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

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
  const canPhaseClose = hasPermission(user, "PHASE_CLOSE");

  const downloadEvidenceDocument = async (documentId: string) => {
    const previewWindow = window.open("about:blank", "_blank");
    setIsDownloading(true);
    setDownloadError("");
    try {
      const { blob, fileName } = await downloadDossierDocument(
        dossierId,
        documentId,
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
      setDownloadError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Evidence block ──────────────────────────────────────────────────────────

  const evidenceEntries = (
    Object.keys(EVIDENCE_LABELS) as (keyof typeof phase)[]
  ).filter((key) => Boolean(phase[key]));

  const evidenceBlock =
    evidenceEntries.length > 0 ? (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Documents disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 xl:grid-cols-2">
            {evidenceEntries.map((key) => (
              <li
                key={key}
                className="flex min-h-9 items-center justify-between gap-2 rounded-md bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">{EVIDENCE_LABELS[key]}</span>
                {phase[key] ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 px-2 text-xs"
                    disabled={isDownloading}
                    onClick={() =>
                      void downloadEvidenceDocument(String(phase[key]))
                    }
                  >
                    <Download className="h-3 w-3" />
                    <span className="sr-only">Télécharger</span>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Non disponible
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Liste complète et contexte documentaire disponibles dans l'onglet
            Documents.
          </p>
          {downloadError ? (
            <div className="mt-2">
              <ActionError message={downloadError} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    ) : null;

  // ── Next action card ────────────────────────────────────────────────────────

  let nextActionContent: React.ReactNode;

  if (isClosed) {
    nextActionContent = (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <p>
          Phase préliminaire clôturée. La phase de demande formelle est prête à
          démarrer.
        </p>
      </div>
    );
  } else if (
    ps === null ||
    ps === "preliminary_not_started" ||
    ps === "preliminary_started"
  ) {
    nextActionContent = canManageMeetings ? (
      <Button onClick={() => setOpenDialog("invite_first")}>
        Planifier la première réunion de contact
      </Button>
    ) : (
      <WaitingState>En attente de planification par l'équipe DN.</WaitingState>
    );
  } else if (ps === "first_meeting_invited") {
    nextActionContent = canManageMeetings ? (
      <Button onClick={() => setOpenDialog("record_first")}>
        Joindre le compte rendu de première réunion
      </Button>
    ) : (
      <WaitingState>
        En attente d'enregistrement de la première réunion par l'équipe DN.
      </WaitingState>
    );
  } else if (ps === "first_meeting_held") {
    nextActionContent = canPublishDocuments ? (
      <Button onClick={() => setOpenDialog("publish_pre_eval")}>
        Mettre le formulaire pré-évaluation à disposition
      </Button>
    ) : (
      <WaitingState>
        En attente de publication du formulaire de pré-évaluation.
      </WaitingState>
    );
  } else if (ps === "pre_eval_form_available") {
    nextActionContent = (
      <WaitingState>
        En attente de soumission du formulaire par le postulant.
      </WaitingState>
    );
  } else if (ps === "pre_eval_form_submitted") {
    nextActionContent = canHandlePreEvalDgCircuit ? (
      <Button onClick={() => setOpenDialog("send_to_dg")}>
        Mettre en circuit officiel DG
      </Button>
    ) : (
      <WaitingState>
        Formulaire soumis. En attente de traitement par la réception, le bureau
        courrier ou le secrétariat DG.
      </WaitingState>
    );
  } else if (ps === "pre_eval_sent_to_dg") {
    nextActionContent = canHandlePreEvalDgCircuit ? (
      <Button onClick={() => setOpenDialog("record_dg_return")}>
        Enregistrer le retour DG annoté
      </Button>
    ) : (
      <WaitingState>
        Formulaire transmis au circuit officiel. En attente du retour annoté
        scanné par la réception, le bureau courrier ou le secrétariat DG.
      </WaitingState>
    );
  } else if (ps === "pre_eval_dg_decision_recorded") {
    nextActionContent = canManageMeetings ? (
      <Button onClick={() => setOpenDialog("invite_preliminary")}>
        Planifier la réunion préliminaire
      </Button>
    ) : (
      <WaitingState>
        En attente de planification de la réunion préliminaire par l'équipe DN.
      </WaitingState>
    );
  } else if (ps === "preliminary_meeting_invited") {
    nextActionContent = canManageMeetings ? (
      <Button onClick={() => setOpenDialog("record_preliminary")}>
        Joindre le compte rendu de réunion préliminaire
      </Button>
    ) : (
      <WaitingState>
        En attente de tenue de la réunion préliminaire par l'équipe DN.
      </WaitingState>
    );
  } else if (
    ps === "preliminary_meeting_held" ||
    ps === "preliminary_ready_to_close"
  ) {
    nextActionContent = canPhaseClose ? (
      <Button onClick={() => setOpenDialog("close_preliminary")}>
        Clôturer la phase préliminaire
      </Button>
    ) : (
      <WaitingState>Phase préliminaire en attente de clôture.</WaitingState>
    );
  } else {
    nextActionContent = null;
  }

  const nextActionCard = nextActionContent ? (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {isClosed ? "Statut" : "Prochaine action"}
        </CardTitle>
      </CardHeader>
      <CardContent>{nextActionContent}</CardContent>
    </Card>
  ) : null;

  // ── Dialogs ─────────────────────────────────────────────────────────────────

  const dialogs = (
    <>
      <InviteMeetingDialog
        open={openDialog === "invite_first"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        title="Planifier la première réunion de contact"
        onConfirm={(payload) => inviteFirstMeeting(dossierId, payload)}
        onSuccess={onRefresh}
      />
      <RecordMeetingDialog
        open={openDialog === "record_first"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        title="Enregistrer la tenue de la première réunion"
        showVisibleToPostulant
        onConfirm={(fd) => recordFirstMeeting(dossierId, fd)}
        onSuccess={onRefresh}
      />
      <PublishPreEvalDialog
        open={openDialog === "publish_pre_eval"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        dossierId={dossierId}
        onSuccess={onRefresh}
      />
      <SendToDgDialog
        open={openDialog === "send_to_dg"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        dossierId={dossierId}
        onSuccess={onRefresh}
      />
      <RecordDgReturnDialog
        open={openDialog === "record_dg_return"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        dossierId={dossierId}
        onSuccess={onRefresh}
      />
      <InviteMeetingDialog
        open={openDialog === "invite_preliminary"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        title="Planifier la réunion préliminaire"
        onConfirm={(payload) => invitePreliminaryMeeting(dossierId, payload)}
        onSuccess={onRefresh}
      />
      <RecordMeetingDialog
        open={openDialog === "record_preliminary"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        title="Enregistrer la tenue de la réunion préliminaire"
        onConfirm={(fd) => recordPreliminaryMeeting(dossierId, fd)}
        onSuccess={onRefresh}
      />
      <UploadClosureCourrierDialog
        open={openDialog === "upload_closure"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        dossierId={dossierId}
        onSuccess={onRefresh}
      />
      <ClosePreliminaryDialog
        open={openDialog === "close_preliminary"}
        onOpenChange={(v) => !v && setOpenDialog(null)}
        dossierId={dossierId}
        onSuccess={onRefresh}
      />
    </>
  );

  // ── Layout ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Phase metadata */}
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
        {phase.preEvaluationSentToDgAt ? (
          <Field label="Mise en circuit DG">
            {formatDate(phase.preEvaluationSentToDgAt)}
          </Field>
        ) : null}
        {phase.preEvaluationReturnedFromDgAt ? (
          <Field label="Retour DG">
            {formatDate(phase.preEvaluationReturnedFromDgAt)}
          </Field>
        ) : null}
      </DefinitionGrid>

      {/* Meetings summary */}
      {firstMeeting || preliminaryMeeting ? (
        <div className="grid gap-3 xl:grid-cols-2">
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
        </div>
      ) : null}

      {/* Evidence */}
      {evidenceBlock}

      {/* Next action */}
      {nextActionCard}

      {/* Dialogs */}
      {dialogs}
    </div>
  );
}
