import { useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/contexts/AuthContext";
import {
  downloadDossierDocument,
  getInspectionState,
  type AdminInspectionState,
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
  formatDate,
  inspectionStatusLabels,
  phasePaymentStatusLabels,
} from "./dossier-detail.labels";
import {
  CloseInspectionDialog,
  RecordR3AvisDialog,
  UploadAuditInvoiceDialog,
  ValidateAuditPaymentProofDialog,
} from "./inspection-dialogs";
import {
  getPhasePaymentStatusBadgeClass,
  getPhasePaymentStatusBadgeVariant,
} from "./document-evaluation-progress.helpers";

type DialogKey =
  | "upload_invoice"
  | "validate_proof"
  | "record_avis"
  | "close_phase";

function formatOptionalDate(value?: string | null): string {
  return value ? formatDate(value) : "Non renseigné";
}

export function InspectionPhaseWorkspace({
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

  const [state, setState] = useState<AdminInspectionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const canUploadInvoice = hasPermission(user, "PAYMENT_INVOICE_UPLOAD");
  const canValidatePayment = hasPermission(user, "PAYMENT_PROOF_VALIDATE");
  const canViewPayment = hasPermission(user, "PAYMENT_VIEW");
  const canRecordAvis = hasPermission(user, "INSPECTION_AVIS_RECORD");
  const canClose = hasPermission(user, "PHASE_CLOSE");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const next = await getInspectionState(dossierId);
      setState(next);
    } catch (err) {
      setError(
        extractError(
          err,
          "Impossible de charger la phase de démonstration et inspection sur site.",
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
          Chargement de la phase IV...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <ActionError message={error} />;
  }

  if (!state) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Aucune donnée disponible pour cette phase.
        </CardContent>
      </Card>
    );
  }

  const inspectionStatus = state.phase.inspectionStatus;
  const isClosed = inspectionStatus === "inspection_closed";
  const phaseStatusLabel = inspectionStatus
    ? (inspectionStatusLabels[inspectionStatus] ?? inspectionStatus)
    : "Non démarrée";
  const payment = state.payment;
  const paymentStatusLabel =
    phasePaymentStatusLabels[payment.status] ?? payment.status;
  const paymentBadgeVariant = getPhasePaymentStatusBadgeVariant(payment.status);
  const paymentBadgeClass = getPhasePaymentStatusBadgeClass(payment.status);

  const showInvoiceUpload = !payment.invoiceDocumentId && !isClosed;
  const showAvisAction =
    inspectionStatus === "inspection_awaiting_r3_avis" && !state.r3Avis;
  const showClose = inspectionStatus === "inspection_ready_to_close";

  return (
    <>
      <div className="space-y-4">
        {/* ── Section 1 — État de la phase ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Phase 4 — Démonstration et inspection sur site
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DefinitionGrid>
              <Field label="Statut inspection">
                <Badge variant="outline">{phaseStatusLabel}</Badge>
              </Field>
              <Field label="Phase statut">
                <PhaseStatusBadge status={state.phase.status} />
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
              La phase IV couvre la démonstration et l'inspection sur site
              menées par le processus R3, une fois les frais d'audit réglés.
            </Note>
          </CardContent>
        </Card>

        {/* ── Section 2 — Paiement des frais d'audit ────────────────────── */}
        {canViewPayment ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Paiement des frais d'audit
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
                        "facture-frais-audit.pdf",
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
                        "preuve-paiement-frais-audit.pdf",
                      )
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {downloadingId === payment.paymentProofDocumentId
                      ? "Téléchargement..."
                      : "Télécharger la preuve de paiement"}
                  </Button>
                ) : null}

                {showInvoiceUpload && canUploadInvoice ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setOpenDialog("upload_invoice")}
                  >
                    Téléverser la facture
                  </Button>
                ) : null}

                {payment.status === "payment_proof_submitted" &&
                canValidatePayment ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setOpenDialog("validate_proof")}
                  >
                    Valider la preuve de paiement
                  </Button>
                ) : null}
              </div>

              {showInvoiceUpload && !canUploadInvoice ? (
                <WaitingState>
                  En attente du téléversement de la facture par le S5.
                </WaitingState>
              ) : null}

              {payment.status === "payment_proof_submitted" &&
              !canValidatePayment ? (
                <WaitingState>
                  En attente de validation de la preuve de paiement.
                </WaitingState>
              ) : null}

              {payment.status === "payment_proof_rejected" &&
              payment.paymentProofRejectionReason ? (
                <Note>
                  Preuve de paiement rejetée : {payment.paymentProofRejectionReason}
                </Note>
              ) : null}

              {!state.paymentValidated ? (
                <Note>
                  L'avis R3 ne peut être enregistré qu'après validation du
                  paiement des frais d'audit.
                </Note>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Paiement validé — dossier transmis à R3.
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

        {/* ── Section 3 — Avis R3 ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avis R3</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.r3Avis ? (
              <div className="space-y-2">
                <Badge
                  variant={
                    state.r3Avis.decision === "conforme"
                      ? "outline"
                      : "destructive"
                  }
                  className={
                    state.r3Avis.decision === "conforme"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                      : undefined
                  }
                >
                  {state.r3Avis.decision === "conforme"
                    ? "Conforme"
                    : "Non conforme"}
                </Badge>
                {state.r3Avis.observations ? (
                  <p className="rounded-md bg-muted/30 px-3 py-2 text-xs italic text-muted-foreground">
                    {state.r3Avis.observations}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Enregistré le {formatOptionalDate(state.r3Avis.recordedAt)}
                </p>
                {state.r3Avis.documentId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={downloadingId === state.r3Avis.documentId}
                    onClick={() =>
                      downloadDocument(
                        state.r3Avis!.documentId!,
                        "avis-r3.pdf",
                      )
                    }
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {downloadingId === state.r3Avis.documentId
                      ? "Téléchargement..."
                      : "Télécharger le rapport R3"}
                  </Button>
                ) : null}
              </div>
            ) : showAvisAction && canRecordAvis ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setOpenDialog("record_avis")}
              >
                Enregistrer l'avis R3
              </Button>
            ) : showAvisAction ? (
              <WaitingState>
                En attente de l'enregistrement de l'avis par R3.
              </WaitingState>
            ) : (
              <WaitingState>
                L'avis R3 sera disponible après validation du paiement des
                frais d'audit.
              </WaitingState>
            )}
          </CardContent>
        </Card>

        {/* ── Section 4 — Clôture ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clôture de la phase IV
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Phase IV — Démonstration et inspection sur site clôturée.
              </div>
            ) : showClose ? (
              canClose ? (
                <Button
                  variant="destructive"
                  onClick={() => setOpenDialog("close_phase")}
                >
                  Clôturer la Phase IV
                </Button>
              ) : (
                <WaitingState>
                  Phase IV prête à clôturer — en attente de la clôture par le
                  responsable.
                </WaitingState>
              )
            ) : (
              <WaitingState>
                L'avis R3 doit être enregistré avant la clôture.
              </WaitingState>
            )}
          </CardContent>
        </Card>
      </div>

      <UploadAuditInvoiceDialog
        open={openDialog === "upload_invoice"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={() => {
          setOpenDialog(null);
          handleSuccess();
        }}
      />

      <ValidateAuditPaymentProofDialog
        open={openDialog === "validate_proof"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={() => {
          setOpenDialog(null);
          handleSuccess();
        }}
      />

      <RecordR3AvisDialog
        open={openDialog === "record_avis"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        dossierId={dossierId}
        onSuccess={() => {
          setOpenDialog(null);
          handleSuccess();
        }}
      />

      <CloseInspectionDialog
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
