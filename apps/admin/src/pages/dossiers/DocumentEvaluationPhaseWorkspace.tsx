import { useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/contexts/AuthContext";
import {
  downloadDossierDocument,
  getDocumentEvaluationPaymentState,
  getDocumentEvaluations,
  type AdminDocumentEvaluationItem,
  type AdminDocumentEvaluationPaymentState,
  type AdminDocumentEvaluationState,
  type AdminOmaPhase,
} from "@/lib/api/dossiers";
import { hasPermission } from "@/lib/auth/permissions";
import { openBlobInNewTab } from "@/lib/utils/blob";
import { extractError } from "@/lib/utils/error";
import {
  ActionError,
  DefinitionGrid,
  Field,
  Note,
  PhaseStatusBadge,
  WaitingState,
} from "./dossier-detail.helpers";
import {
  documentEvaluationReviewStatusLabels,
  documentEvaluationStatusLabels,
  formatDate,
  phasePaymentStatusLabels,
} from "./dossier-detail.labels";
import {
  CloseDocumentEvaluationDialog,
  ReviewDocumentDialog,
  UploadInvoiceDialog,
} from "./document-evaluation-dialogs";
import {
  getDocumentEvaluationReviewBadgeClass,
  getDocumentEvaluationReviewBadgeVariant,
  getDocumentEvaluationVisibility,
  getPhasePaymentStatusBadgeClass,
  getPhasePaymentStatusBadgeVariant,
} from "./document-evaluation-progress.helpers";

type DialogKey = "upload_invoice" | "review_document" | "close_phase";

function formatOptionalDate(value?: string | null): string {
  return value ? formatDate(value) : "Non renseigné";
}

function EvalStatusBadge({
  status,
}: {
  status: AdminDocumentEvaluationItem["status"];
}): React.JSX.Element {
  const label = documentEvaluationReviewStatusLabels[status] ?? status;
  const variant = getDocumentEvaluationReviewBadgeVariant(status);
  const extraClass = getDocumentEvaluationReviewBadgeClass(status);
  return (
    <Badge variant={variant} className={extraClass || undefined}>
      {label}
    </Badge>
  );
}

function EvaluationCard({
  evaluation,
  canReview,
  isClosed,
  downloadingId,
  onDownload,
  onReview,
}: {
  evaluation: AdminDocumentEvaluationItem;
  canReview: boolean;
  isClosed: boolean;
  downloadingId: string | null;
  onDownload: (documentId: string, fileName: string) => void;
  onReview: (evaluation: AdminDocumentEvaluationItem) => void;
}): React.JSX.Element {
  const submissionDocId = evaluation.submission?.documentId ?? null;
  const correctionDocId =
    evaluation.correctionDocument?.documentId ?? null;
  const isDownloadingMain =
    submissionDocId ? downloadingId === submissionDocId : false;
  const isDownloadingCorrection =
    correctionDocId ? downloadingId === correctionDocId : false;

  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {evaluation.requirement?.label ?? "Document inconnu"}
          </p>
          {evaluation.requirement?.code ? (
            <p className="font-mono text-xs text-muted-foreground">
              {evaluation.requirement.code}
            </p>
          ) : null}
        </div>
        <EvalStatusBadge status={evaluation.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        {submissionDocId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDownloadingMain}
            onClick={() =>
              onDownload(submissionDocId, "document-evalue.pdf")
            }
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isDownloadingMain ? "Téléchargement..." : "Télécharger le document"}
          </Button>
        ) : null}

        {evaluation.status === "correction_submitted" && correctionDocId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDownloadingCorrection}
            onClick={() =>
              onDownload(correctionDocId, "document-corrige.pdf")
            }
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {isDownloadingCorrection
              ? "Téléchargement..."
              : "Télécharger la correction"}
          </Button>
        ) : null}
      </div>

      {evaluation.annotation ? (
        <div className="rounded-md bg-muted/30 px-3 py-2 text-xs italic text-muted-foreground">
          {evaluation.annotation}
        </div>
      ) : null}

      {canReview && !isClosed ? (
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onReview(evaluation)}
          >
            {evaluation.status === "pending"
              ? "Évaluer"
              : "Modifier l'évaluation"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function DocumentEvaluationPhaseWorkspace({
  dossierId,
  phaseRecord,
  onRefresh,
}: {
  dossierId: string;
  phaseRecord?: AdminOmaPhase;
  onRefresh?: () => void;
}): React.JSX.Element {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;

  const [paymentState, setPaymentState] =
    useState<AdminDocumentEvaluationPaymentState | null>(null);
  const [evalState, setEvalState] =
    useState<AdminDocumentEvaluationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);
  const [reviewTarget, setReviewTarget] =
    useState<AdminDocumentEvaluationItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const canUploadInvoice = hasPermission(user, "PAYMENT_INVOICE_UPLOAD");
  const canViewPayment = hasPermission(user, "PAYMENT_VIEW");
  const canReview = hasPermission(user, "DOCUMENT_REVIEW");
  const canClose = hasPermission(user, "PHASE_CLOSE");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const ps = await getDocumentEvaluationPaymentState(dossierId);
      setPaymentState(ps);

      if (ps.canStartDocumentEvaluation) {
        const es = await getDocumentEvaluations(dossierId);
        setEvalState(es);
      } else {
        setEvalState(null);
      }
    } catch (err) {
      setError(
        extractError(
          err,
          "Impossible de charger la phase d'évaluation approfondie.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [dossierId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSuccess = useCallback(() => {
    void loadData();
    onRefresh?.();
  }, [loadData, onRefresh]);

  const downloadDocument = (documentId: string, fileName: string) => {
    setDownloadingId(documentId);
    void downloadDossierDocument(dossierId, documentId)
      .then((result) => {
        openBlobInNewTab(result.blob, result.fileName || fileName);
      })
      .catch(() => {
        // silently handled — user sees no change on download failure
      })
      .finally(() => {
        setDownloadingId(null);
      });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Chargement de la phase III...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <ActionError message={error} />;
  }

  if (!paymentState) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Aucune donnée disponible pour cette phase.
        </CardContent>
      </Card>
    );
  }

  const vis = getDocumentEvaluationVisibility(paymentState, evalState);
  const docEvalStatus = paymentState.phase.documentEvaluationStatus;
  const isClosed = docEvalStatus === "document_evaluation_closed";
  const phaseStatusLabel = docEvalStatus
    ? (documentEvaluationStatusLabels[docEvalStatus] ?? docEvalStatus)
    : "Non démarrée";
  const payment = paymentState.payment;
  const paymentStatusLabel =
    phasePaymentStatusLabels[payment.status] ?? payment.status;
  const paymentBadgeVariant = getPhasePaymentStatusBadgeVariant(payment.status);
  const paymentBadgeClass = getPhasePaymentStatusBadgeClass(payment.status);

  const correctionEvaluations = evalState
    ? evalState.evaluations.filter(
        (e) =>
          e.status === "non_satisfaisant" ||
          e.status === "correction_submitted",
      )
    : [];

  return (
    <>
      <div className="space-y-4">
        {/* ── Section 1 — État de la phase ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Phase 3 — Évaluation approfondie des documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DefinitionGrid>
              <Field label="Statut évaluation">
                <Badge variant="outline">{phaseStatusLabel}</Badge>
              </Field>
              <Field label="Phase statut">
                <PhaseStatusBadge status={paymentState.phase.status} />
              </Field>
              <Field label="Démarrée le">
                {formatOptionalDate(phaseRecord?.startedAt)}
              </Field>
              {isClosed ? (
                <Field label="Clôturée le">
                  {formatOptionalDate(phaseRecord?.closedAt)}
                </Field>
              ) : null}
            </DefinitionGrid>
            <Note>
              La phase III permet l'étude approfondie des documents soumis en
              phase II.
            </Note>
          </CardContent>
        </Card>

        {/* ── Section 2 — Paiement des frais d'étude ────────────────────── */}
        {canViewPayment ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Paiement des frais d'étude
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={paymentBadgeVariant}
                  className={paymentBadgeClass || undefined}
                >
                  {paymentStatusLabel}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {payment.invoiceDocumentId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={downloadingId === payment.invoiceDocumentId}
                    onClick={() =>
                      downloadDocument(
                        payment.invoiceDocumentId!,
                        "facture-frais-etude.pdf",
                      )
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {downloadingId === payment.invoiceDocumentId
                      ? "Téléchargement..."
                      : "Télécharger la facture"}
                  </Button>
                ) : null}

                {payment.paymentProofDocumentId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      downloadingId === payment.paymentProofDocumentId
                    }
                    onClick={() =>
                      downloadDocument(
                        payment.paymentProofDocumentId!,
                        "preuve-paiement-frais-etude.pdf",
                      )
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {downloadingId === payment.paymentProofDocumentId
                      ? "Téléchargement..."
                      : "Télécharger la preuve de paiement"}
                  </Button>
                ) : null}

                {vis.showInvoiceUpload && canUploadInvoice ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setOpenDialog("upload_invoice")}
                  >
                    Téléverser la facture
                  </Button>
                ) : null}
              </div>

              {vis.showInvoiceUpload && !canUploadInvoice ? (
                <WaitingState>
                  En attente du téléversement de la facture par le S5.
                </WaitingState>
              ) : null}

              {!paymentState.canStartDocumentEvaluation ? (
                <Note>
                  L'évaluation documentaire démarre après réception de la preuve
                  de paiement.
                </Note>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Paiement reçu — évaluation documentaire disponible.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <WaitingState>
                Accès au détail du paiement non autorisé.
              </WaitingState>
            </CardContent>
          </Card>
        )}

        {/* ── Section 3 — Documents à évaluer ──────────────────────────── */}
        {vis.showEvaluationBoard ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
                  Documents à évaluer
                </CardTitle>
                {evalState ? (
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {evalState.progress.satisfaisant}
                    </span>
                    /{evalState.progress.total} satisfaisants
                  </span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {!evalState ? (
                <p className="text-sm text-muted-foreground">
                  Chargement des évaluations...
                </p>
              ) : evalState.evaluations.length === 0 ? (
                <WaitingState>
                  Aucun document à évaluer pour le moment.
                </WaitingState>
              ) : (
                <div className="space-y-3">
                  {evalState.evaluations.map((evaluation) => (
                    <EvaluationCard
                      key={evaluation.id}
                      evaluation={evaluation}
                      canReview={canReview}
                      isClosed={isClosed}
                      downloadingId={downloadingId}
                      onDownload={downloadDocument}
                      onReview={(ev) => {
                        setReviewTarget(ev);
                        setOpenDialog("review_document");
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* ── Section 4 — Corrections demandées ────────────────────────── */}
        {vis.showCorrections && correctionEvaluations.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Corrections demandées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {correctionEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="rounded-md border bg-muted/10 p-3 text-sm space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {evaluation.requirement?.label ?? "Document"}
                      </p>
                      <EvalStatusBadge status={evaluation.status} />
                    </div>
                    {evaluation.annotation ? (
                      <p className="text-xs italic text-muted-foreground">
                        {evaluation.annotation}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {evaluation.status === "non_satisfaisant"
                        ? "Correction attendue du postulant."
                        : "Correction reçue — en attente de réévaluation."}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* ── Section 5 — Clôture ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clôture de la phase III
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Phase III — Évaluation approfondie clôturée.
              </div>
            ) : vis.showClose ? (
              canClose ? (
                <Button
                  variant="destructive"
                  onClick={() => setOpenDialog("close_phase")}
                >
                  Clôturer la Phase III
                </Button>
              ) : (
                <WaitingState>
                  Phase III prête à clôturer — en attente de la clôture par le
                  responsable.
                </WaitingState>
              )
            ) : (
              <WaitingState>
                Toutes les évaluations doivent être satisfaisantes avant la
                clôture.
              </WaitingState>
            )}
          </CardContent>
        </Card>
      </div>

      <UploadInvoiceDialog
        open={openDialog === "upload_invoice"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={(nextState) => {
          setPaymentState(nextState);
          setOpenDialog(null);
          onRefresh?.();
        }}
      />

      <ReviewDocumentDialog
        open={openDialog === "review_document"}
        onOpenChange={(value) => {
          if (!value) {
            setOpenDialog(null);
            setReviewTarget(null);
          }
        }}
        dossierId={dossierId}
        evaluation={reviewTarget}
        onSuccess={() => {
          setOpenDialog(null);
          setReviewTarget(null);
          handleSuccess();
        }}
      />

      <CloseDocumentEvaluationDialog
        open={openDialog === "close_phase"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={() => {
          setOpenDialog(null);
          handleSuccess();
        }}
      />
    </>
  );
}
