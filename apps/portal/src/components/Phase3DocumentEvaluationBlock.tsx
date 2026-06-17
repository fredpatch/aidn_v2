import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileText, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { PortalApiError } from "../lib/api/http";
import { downloadPortalDossierDocument } from "../lib/api/dossiers";
import {
  getPortalPhase3State,
  uploadPortalDocumentEvaluationCorrection,
  uploadPortalPaymentProof,
  type PortalDocumentEvaluationEntry,
  type PortalPhase3State,
} from "../lib/api/document-evaluation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getErrMsg(caught: unknown): string {
  return caught instanceof PortalApiError
    ? caught.message
    : "Une erreur est survenue. Veuillez réessayer.";
}

const PHASE_STATUS_LABELS: Record<string, string> = {
  document_evaluation_waiting_invoice: "En attente de facture",
  document_evaluation_waiting_payment: "En attente du paiement",
  document_evaluation_payment_proof_submitted: "Preuve de paiement envoyée",
  document_evaluation_study_in_progress: "Évaluation en cours",
  document_evaluation_waiting_corrections: "Corrections demandées",
  document_evaluation_ready_to_close: "Évaluation finalisée",
  document_evaluation_closed: "Phase III clôturée",
};

const EVAL_STATUS_LABELS: Record<string, string> = {
  pending: "En cours d'examen",
  satisfaisant: "Satisfaisant",
  non_satisfaisant: "Correction demandée",
  correction_submitted: "Correction envoyée",
};

function EvalStatusChip({ status }: { status: string }): React.JSX.Element {
  if (status === "satisfaisant") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={11} aria-hidden="true" />
        {EVAL_STATUS_LABELS[status] ?? status}
      </span>
    );
  }
  if (status === "non_satisfaisant") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
        {EVAL_STATUS_LABELS[status] ?? status}
      </span>
    );
  }
  if (status === "correction_submitted") {
    return (
      <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
        {EVAL_STATUS_LABELS[status] ?? status}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
      {EVAL_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── CorrectionUploadForm ──────────────────────────────────────────────────────

function CorrectionUploadForm({
  entry,
  onSuccess,
}: {
  entry: PortalDocumentEvaluationEntry;
  onSuccess: () => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }
    const form = new FormData();
    form.set("file", file);
    if (notes.trim()) form.set("notes", notes.trim());

    setBusy(true);
    setError("");
    try {
      await uploadPortalDocumentEvaluationCorrection(entry.evaluationId, form);
      if (fileRef.current) fileRef.current.value = "";
      setNotes("");
      toast.success("Correction envoyée.");
      onSuccess();
    } catch (caught) {
      setError(getErrMsg(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-bold uppercase text-amber-700">
        Action requise
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">
        {entry.requirementLabel}
        {entry.requirementCode ? (
          <span className="ml-2 font-mono text-xs font-normal text-slate-500">
            {entry.requirementCode}
          </span>
        ) : null}
      </p>

      {entry.annotation ? (
        <div className="mt-2 rounded border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700">
          <p className="text-xs font-semibold text-amber-800">
            Annotation DN :
          </p>
          <p className="mt-1 whitespace-pre-line">{entry.annotation}</p>
        </div>
      ) : null}

      <form
        className="mt-3 grid gap-3"
        onSubmit={(e) => void handleSubmit(e)}
      >
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
        <div className="field">
          <label htmlFor={`correction-file-${entry.evaluationId}`}>
            Document corrigé <span aria-hidden="true">*</span>
          </label>
          <input
            id={`correction-file-${entry.evaluationId}`}
            ref={fileRef}
            className="control"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            required
            disabled={busy}
            onChange={() => setError("")}
          />
          <p className="mt-1 text-xs text-slate-500">PDF, JPG ou PNG.</p>
        </div>
        <div className="field">
          <label htmlFor={`correction-notes-${entry.evaluationId}`}>
            Observations (optionnel)
          </label>
          <textarea
            id={`correction-notes-${entry.evaluationId}`}
            className="control"
            rows={2}
            value={notes}
            disabled={busy}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary w-fit"
          disabled={busy}
        >
          <Upload size={14} aria-hidden="true" />
          {busy ? "Envoi en cours…" : "Déposer le document corrigé"}
        </button>
      </form>
    </div>
  );
}

// ── Phase3DocumentEvaluationBlock ─────────────────────────────────────────────

export function Phase3DocumentEvaluationBlock({
  dossierId,
}: {
  dossierId: string;
}): React.JSX.Element | null {
  const [state, setState] = useState<PortalPhase3State | null>(null);
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
      setState(await getPortalPhase3State(dossierId));
    } catch (caught) {
      if (caught instanceof PortalApiError && caught.status === 404) {
        // Phase 3 not opened yet — hide block silently
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
      await uploadPortalPaymentProof(dossierId, form);
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
          Chargement de la Phase III…
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

  const { phase, payment, canUploadPaymentProof, evaluations } = state;
  const phaseClosed = phase.status === "closed";

  const correctionItems = evaluations.filter((e) => e.canUploadCorrection);
  const correctionSubmittedItems = evaluations.filter(
    (e) => e.status === "correction_submitted",
  );

  const phaseStatusLabel =
    phase.documentEvaluationStatus
      ? (PHASE_STATUS_LABELS[phase.documentEvaluationStatus] ?? phase.documentEvaluationStatus)
      : null;

  return (
    <div className="surface rounded-lg p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-sky-600" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-slate-950">
              Phase III — Évaluation approfondie
            </h3>
            <p className="text-xs text-slate-500">
              Suivi de la facture, du paiement et des corrections
              documentaires.
            </p>
          </div>
        </div>
        {phaseStatusLabel ? (
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              phaseClosed
                ? "bg-emerald-50 text-emerald-700"
                : phase.documentEvaluationStatus === "document_evaluation_waiting_corrections"
                  ? "bg-amber-50 text-amber-700"
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
                    "facture-frais-etude.pdf",
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
          ) : payment.paymentProofDocumentId ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 size={14} aria-hidden="true" />
                Preuve de paiement envoyée
              </span>
              <button
                type="button"
                className="btn btn-secondary py-1 text-xs"
                onClick={() =>
                  void downloadDoc(
                    payment.paymentProofDocumentId!,
                    "preuve-paiement-frais-etude.pdf",
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
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <p className="font-semibold text-amber-800">
                  Action requise — Déposer la preuve de paiement
                </p>
                <p className="mt-0.5 text-amber-700">
                  Téléversez la quittance ou preuve de paiement des frais
                  d'étude.
                </p>
              </div>

              {proofError ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {proofError}
                </p>
              ) : null}

              <div className="field">
                <label htmlFor="proof-file">
                  Preuve de paiement <span aria-hidden="true">*</span>
                </label>
                <input
                  id="proof-file"
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
                <label htmlFor="proof-notes">
                  Observations (optionnel)
                </label>
                <textarea
                  id="proof-notes"
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

        {/* Section 3 — Évaluation des documents */}
        {evaluations.length > 0 ? (
          <div className="rounded-md border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Évaluation des documents
            </p>
            <ul className="grid gap-2">
              {evaluations.map((ev) => (
                <li
                  key={ev.evaluationId}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {ev.requirementLabel}
                    {ev.requirementCode ? (
                      <span className="ml-1.5 font-mono text-xs font-normal text-slate-400">
                        {ev.requirementCode}
                      </span>
                    ) : null}
                  </span>
                  <EvalStatusChip status={ev.status} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            L'évaluation documentaire commencera après réception de la preuve de
            paiement.
          </p>
        )}

        {/* Section 4 — Corrections demandées */}
        {correctionItems.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Corrections demandées
            </p>
            {correctionItems.map((ev) => (
              <CorrectionUploadForm
                key={ev.evaluationId}
                entry={ev}
                onSuccess={() => void loadState()}
              />
            ))}
          </div>
        )}

        {/* Correction submitted notice */}
        {correctionSubmittedItems.length > 0 && correctionItems.length === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              Correction{correctionSubmittedItems.length > 1 ? "s" : ""} envoyée
              {correctionSubmittedItems.length > 1 ? "s" : ""} — en attente de
              revue DN.
            </p>
          </div>
        )}

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
