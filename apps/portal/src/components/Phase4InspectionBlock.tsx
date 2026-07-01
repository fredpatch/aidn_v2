import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileText, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { PortalApiError } from "../lib/api/http";
import { downloadPortalDossierDocument } from "../lib/api/dossiers";
import {
  getPortalInspectionState,
  uploadPortalInspectionPaymentProof,
  type PortalInspectionState,
} from "../lib/api/inspection";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getErrMsg(caught: unknown): string {
  return caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez réessayer.";
}

const PHASE_STATUS_LABELS: Record<string, string> = {
  inspection_waiting_invoice: "En attente de facture",
  inspection_waiting_payment: "En attente du paiement",
  inspection_payment_proof_submitted: "Preuve de paiement envoyée",
  inspection_awaiting_r3_avis: "Inspection en cours",
  inspection_ready_to_close: "Inspection finalisée",
  inspection_closed: "Phase IV clôturée",
};

// ── Phase4InspectionBlock ────────────────────────────────────────────────────

export function Phase4InspectionBlock({
  dossierId,
}: {
  dossierId: string;
}): React.JSX.Element | null {
  const [state, setState] = useState<PortalInspectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Payment proof upload
  const proofFileRef = useRef<HTMLInputElement>(null);
  const [proofNotes, setProofNotes] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  const [proofError, setProofError] = useState("");

  const loadState = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setState(await getPortalInspectionState(dossierId));
    } catch (caught) {
      if (caught instanceof PortalApiError && caught.status === 404) {
        // Phase 4 not opened yet — hide block silently
        setState(null);
      } else {
        setLoadError(getErrMsg(caught));
      }
    } finally {
      setLoading(false);
    }
  }, [dossierId]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const downloadDoc = async (documentId: string, fileName: string) => {
    try {
      const blob = await downloadPortalDossierDocument(dossierId, documentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      toast.error(getErrMsg(caught));
    }
  };

  const handleProofUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = proofFileRef.current?.files?.[0];
    if (!file) {
      setProofError("Veuillez sélectionner un fichier.");
      return;
    }
    const form = new FormData();
    form.set("file", file);
    if (proofNotes.trim()) form.set("notes", proofNotes.trim());

    setProofBusy(true);
    setProofError("");
    try {
      await uploadPortalInspectionPaymentProof(dossierId, form);
      if (proofFileRef.current) proofFileRef.current.value = "";
      setProofNotes("");
      toast.success("Preuve de paiement envoyée.");
      void loadState();
    } catch (caught) {
      setProofError(getErrMsg(caught));
    } finally {
      setProofBusy(false);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="surface rounded-lg p-5">
        <p className="text-sm text-slate-500">
          Chargement de la Phase IV…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
        {loadError}
      </div>
    );
  }

  if (!state) return null;

  const { payment, canUploadPaymentProof } = state;
  const phaseClosed = state.inspectionStatus === "inspection_closed";

  const phaseStatusLabel = state.inspectionStatus
    ? (PHASE_STATUS_LABELS[state.inspectionStatus] ?? state.inspectionStatus)
    : null;

  return (
    <div className="surface rounded-lg p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-sky-600" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-slate-950">
              Phase IV — Démonstration et inspection sur site
            </h3>
            <p className="text-xs text-slate-500">
              Suivi de la facture et du paiement des frais d'audit.
            </p>
          </div>
        </div>
        {phaseStatusLabel ? (
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              phaseClosed
                ? "bg-emerald-50 text-emerald-700"
                : "bg-sky-50 text-sky-700",
            ].join(" ")}
          >
            {phaseStatusLabel}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4">
        {/* Section 1 — Facture */}
        <div className="rounded-md border border-slate-200 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">Facture</p>
          {payment.invoiceDocumentId ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 size={14} aria-hidden="true" />
                Facture disponible
              </span>
              <button
                type="button"
                className="btn btn-secondary py-1 text-xs"
                onClick={() =>
                  void downloadDoc(
                    payment.invoiceDocumentId!,
                    "facture-frais-audit.pdf",
                  )
                }
              >
                <Download size={13} aria-hidden="true" />
                Télécharger la facture
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              En attente de la facture ANAC.
            </p>
          )}
        </div>

        {/* Section 2 — Paiement */}
        <div className="rounded-md border border-slate-200 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Preuve de paiement
          </p>

          {!payment.invoiceDocumentId ? (
            <p className="text-sm text-slate-500">
              Le dépôt de la preuve sera disponible après réception de la
              facture.
            </p>
          ) : payment.status === "payment_proof_validated" ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 size={14} aria-hidden="true" />
                Paiement validé par l'ANAC
              </span>
              {payment.paymentProofDocumentId ? (
                <button
                  type="button"
                  className="btn btn-secondary py-1 text-xs"
                  onClick={() =>
                    void downloadDoc(
                      payment.paymentProofDocumentId!,
                      "preuve-paiement-frais-audit.pdf",
                    )
                  }
                >
                  <Download size={13} aria-hidden="true" />
                  Télécharger la preuve déposée
                </button>
              ) : null}
            </div>
          ) : payment.status === "payment_proof_submitted" &&
            payment.paymentProofDocumentId ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-amber-700">
                <CheckCircle2 size={14} aria-hidden="true" />
                Preuve envoyée — en attente de validation par l'ANAC
              </span>
              <button
                type="button"
                className="btn btn-secondary py-1 text-xs"
                onClick={() =>
                  void downloadDoc(
                    payment.paymentProofDocumentId!,
                    "preuve-paiement-frais-audit.pdf",
                  )
                }
              >
                <Download size={13} aria-hidden="true" />
                Télécharger la preuve déposée
              </button>
            </div>
          ) : canUploadPaymentProof ? (
            <form
              className="grid gap-3"
              onSubmit={(e) => void handleProofUpload(e)}
            >
              {payment.status === "payment_proof_rejected" ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-red-800">
                    Preuve de paiement rejetée
                  </p>
                  {payment.paymentProofRejectionReason ? (
                    <p className="mt-0.5 text-red-700">
                      Motif : {payment.paymentProofRejectionReason}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-red-700">
                    Veuillez déposer une nouvelle preuve de paiement.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-amber-800">
                    Action requise — Déposer la preuve de paiement
                  </p>
                  <p className="mt-0.5 text-amber-700">
                    Téléversez la quittance ou preuve de paiement des frais
                    d'audit.
                  </p>
                </div>
              )}

              {proofError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {proofError}
                </p>
              ) : null}

              <div className="field">
                <label htmlFor="inspection-proof-file">
                  Preuve de paiement <span aria-hidden="true">*</span>
                </label>
                <input
                  id="inspection-proof-file"
                  ref={proofFileRef}
                  className="control"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  disabled={proofBusy}
                  onChange={() => setProofError("")}
                />
                <p className="mt-1 text-xs text-slate-500">PDF, JPG ou PNG.</p>
              </div>

              <div className="field">
                <label htmlFor="inspection-proof-notes">
                  Observations (optionnel)
                </label>
                <textarea
                  id="inspection-proof-notes"
                  className="control"
                  rows={2}
                  value={proofNotes}
                  disabled={proofBusy}
                  onChange={(e) => setProofNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-fit"
                disabled={proofBusy}
              >
                <Upload size={14} aria-hidden="true" />
                {proofBusy ? "Envoi en cours…" : "Envoyer la preuve"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-500">
              En attente de la facture ANAC avant dépôt de la preuve.
            </p>
          )}
        </div>

        {/* Section 3 — Inspection */}
        <div className="rounded-md border border-slate-200 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Démonstration et inspection sur site
          </p>
          {phaseClosed ? (
            <p className="flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 size={14} aria-hidden="true" />
              Phase IV clôturée. Le courrier de clôture vous a été transmis.
            </p>
          ) : payment.status === "payment_proof_validated" ? (
            <p className="text-sm text-slate-500">
              Votre paiement a été validé. Le processus R3 procède à la
              démonstration et inspection sur site.
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Cette étape débutera après validation du paiement des frais
              d'audit.
            </p>
          )}
        </div>

        {/* Refresh link */}
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-secondary py-1 text-xs"
            onClick={() => void loadState()}
            disabled={loading}
          >
            <RefreshCw size={12} aria-hidden="true" />
            Actualiser l'état
          </button>
        </div>
      </div>
    </div>
  );
}
