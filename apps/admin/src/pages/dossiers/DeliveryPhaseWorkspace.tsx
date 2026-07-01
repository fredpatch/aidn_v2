import { useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthContext } from "@/contexts/AuthContext";
import {
  downloadDossierDocument,
  getCertificateForDossier,
  getDeliveryState,
  type AdminCertificate,
  type AdminDeliveryState,
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
  certificateStatusLabels,
  certificateTypeLabels,
  deliveryStatusLabels,
  formatDate,
  phasePaymentStatusLabels,
} from "./dossier-detail.labels";
import {
  AdvanceCertificateDialog,
  CloseDeliveryDialog,
  UploadCertificateFeeInvoiceDialog,
  ValidateCertificateFeePaymentProofDialog,
} from "./delivery-dialogs";
import {
  getPhasePaymentStatusBadgeClass,
  getPhasePaymentStatusBadgeVariant,
} from "./document-evaluation-progress.helpers";

type DialogKey =
  | "upload_invoice"
  | "validate_proof"
  | "advance_certificate"
  | "close_phase";

const CERTIFICATE_ADVANCE_LABELS: Record<string, string> = {
  to_prepare: "Marquer imprimé",
  printed: "Marquer envoyé pour signature DG",
  sent_for_dg_signature: "Téléverser le certificat signé",
  ready_for_collection: "Confirmer le retrait",
  collected: "Archiver",
};

function formatOptionalDate(value?: string | null): string {
  return value ? formatDate(value) : "Non renseigné";
}

export function DeliveryPhaseWorkspace({
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

  const [state, setState] = useState<AdminDeliveryState | null>(null);
  const [certificate, setCertificate] = useState<AdminCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState<DialogKey | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const canUploadInvoice = hasPermission(user, "PAYMENT_INVOICE_UPLOAD");
  const canValidatePayment = hasPermission(user, "PAYMENT_PROOF_VALIDATE");
  const canViewPayment = hasPermission(user, "PAYMENT_VIEW");
  const canManageCertificate = hasPermission(user, "CERTIFICATE_MANAGE");
  const canViewCertificate = hasPermission(user, "CERTIFICATE_VIEW");
  const canClose = hasPermission(user, "PHASE_CLOSE");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const next = await getDeliveryState(dossierId);
      setState(next);

      if (next.paymentValidated) {
        try {
          const { certificate: cert } = await getCertificateForDossier(
            dossierId,
          );
          setCertificate(cert);
        } catch {
          setCertificate(null);
        }
      } else {
        setCertificate(null);
      }
    } catch (err) {
      setError(
        extractError(err, "Impossible de charger la phase de délivrance."),
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
          Chargement de la phase V...
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

  const deliveryStatus = state.phase.deliveryStatus;
  const isClosed = deliveryStatus === "delivery_closed";
  const phaseStatusLabel = deliveryStatus
    ? (deliveryStatusLabels[deliveryStatus] ?? deliveryStatus)
    : "Non démarrée";
  const payment = state.payment;
  const paymentStatusLabel =
    phasePaymentStatusLabels[payment.status] ?? payment.status;
  const paymentBadgeVariant = getPhasePaymentStatusBadgeVariant(payment.status);
  const paymentBadgeClass = getPhasePaymentStatusBadgeClass(payment.status);

  const showInvoiceUpload = !payment.invoiceDocumentId && !isClosed;
  const canCloseNow =
    certificate &&
    (certificate.status === "collected" || certificate.status === "archived");
  const advanceLabel = certificate
    ? CERTIFICATE_ADVANCE_LABELS[certificate.status]
    : undefined;

  return (
    <>
      <div className="space-y-4">
        {/* ── Section 1 — État de la phase ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Phase 5 — Délivrance du certificat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DefinitionGrid>
              <Field label="Statut délivrance">
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
              La phase V reste ouverte jusqu'au retrait effectif du
              certificat par le postulant — le délai de délivrance est
              l'indicateur suivi sur cette phase.
            </Note>
          </CardContent>
        </Card>

        {/* ── Section 2 — Paiement des frais de délivrance ──────────────── */}
        {canViewPayment ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Paiement des frais de délivrance
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
                        "facture-frais-delivrance.pdf",
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
                        "preuve-paiement-frais-delivrance.pdf",
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
                  La préparation du certificat démarre après validation du
                  paiement des frais de délivrance.
                </Note>
              ) : null}
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

        {/* ── Section 3 — Certificat ─────────────────────────────────────── */}
        {state.paymentValidated && canViewCertificate ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Certificat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {certificate ? (
                <>
                  <DefinitionGrid>
                    <Field label="Numéro">
                      {certificate.certificateNumber}
                    </Field>
                    <Field label="Type">
                      {certificateTypeLabels[certificate.certificateType] ??
                        certificate.certificateType}
                    </Field>
                    <Field label="Statut">
                      <Badge
                        variant={
                          certificate.status === "collected" ||
                          certificate.status === "archived"
                            ? "outline"
                            : "secondary"
                        }
                        className={
                          certificate.status === "collected" ||
                          certificate.status === "archived"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                            : undefined
                        }
                      >
                        {certificateStatusLabels[certificate.status] ??
                          certificate.status}
                      </Badge>
                    </Field>
                  </DefinitionGrid>

                  {certificate.signedDocumentId &&
                  (certificate.status === "collected" ||
                    certificate.status === "archived") ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={downloadingId === certificate.signedDocumentId}
                      onClick={() =>
                        downloadDocument(
                          certificate.signedDocumentId!,
                          "certificat-signe.pdf",
                        )
                      }
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      {downloadingId === certificate.signedDocumentId
                        ? "Téléchargement..."
                        : "Télécharger le certificat signé"}
                    </Button>
                  ) : null}

                  {certificate.status === "collected" &&
                  certificate.collectionNote ? (
                    <Note>Note de retrait : {certificate.collectionNote}</Note>
                  ) : null}

                  {advanceLabel && canManageCertificate ? (
                    <div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setOpenDialog("advance_certificate")}
                      >
                        {advanceLabel}
                      </Button>
                    </div>
                  ) : advanceLabel ? (
                    <WaitingState>
                      En attente de l'étape suivante ({advanceLabel}).
                    </WaitingState>
                  ) : null}
                </>
              ) : (
                <WaitingState>Certificat en cours de création...</WaitingState>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* ── Section 4 — Clôture ───────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clôture de la phase V
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                Dossier clôturé.
              </div>
            ) : canCloseNow ? (
              canClose ? (
                <Button
                  variant="destructive"
                  onClick={() => setOpenDialog("close_phase")}
                >
                  Clôturer le dossier
                </Button>
              ) : (
                <WaitingState>
                  Certificat retiré — en attente de la clôture par le
                  responsable.
                </WaitingState>
              )
            ) : (
              <WaitingState>
                Le certificat doit être retiré par le postulant avant la
                clôture.
              </WaitingState>
            )}
          </CardContent>
        </Card>
      </div>

      <UploadCertificateFeeInvoiceDialog
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

      <ValidateCertificateFeePaymentProofDialog
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

      <AdvanceCertificateDialog
        open={openDialog === "advance_certificate"}
        onOpenChange={(value) => {
          if (!value) setOpenDialog(null);
        }}
        certificate={certificate}
        onSuccess={() => {
          setOpenDialog(null);
          handleSuccess();
        }}
      />

      <CloseDeliveryDialog
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
