import { useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  closeInspectionPhase,
  recordR3Avis,
  uploadAuditFeeInvoice,
  validateAuditFeePaymentProof,
  type AdminInspectionCloseResult,
  type AdminInspectionState,
} from "@/lib/api/dossiers";
import { extractError } from "@/lib/utils/error";
import { ActionError } from "./dossier-detail.helpers";
import { UploadDocumentDialog } from "./components/UploadDocumentDialog";

// ── UploadAuditInvoiceDialog ────────────────────────────────────────────────

export function UploadAuditInvoiceDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (state: AdminInspectionState) => void;
}): React.JSX.Element {
  const handleSubmit = async ({
    file,
    date,
    notes,
  }: {
    file: File;
    date?: string;
    notes?: string;
  }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (date) formData.append("issuedAt", date);
    if (notes) formData.append("notes", notes);
    const nextState = await uploadAuditFeeInvoice(dossierId, formData);
    onSuccess(nextState);
  };

  return (
    <UploadDocumentDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Téléverser la facture des frais d'audit"
      description="Joignez la facture émise par le S5 pour la phase de démonstration et inspection sur site. Le postulant sera notifié pour effectuer le paiement."
      fileLabel="Facture"
      dateLabel="Date d'émission"
      notesLabel="Notes"
      submitLabel="Téléverser la facture"
      onSubmit={handleSubmit}
    />
  );
}

// ── ValidateAuditPaymentProofDialog ─────────────────────────────────────────

export function ValidateAuditPaymentProofDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (state: AdminInspectionState) => void;
}): React.JSX.Element {
  const [decision, setDecision] = useState<"validated" | "rejected">(
    "validated",
  );
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setDecision("validated");
    setObservations("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === "rejected" && !observations.trim()) {
      setError("Un motif est requis pour rejeter la preuve de paiement.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const nextState = await validateAuditFeePaymentProof(dossierId, {
        decision,
        observations: observations.trim() || undefined,
      });
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible d'enregistrer la décision."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) reset();
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valider la preuve de paiement (audit)</DialogTitle>
          <DialogDescription>
            Confirmez que la quittance déposée correspond bien au paiement
            des frais d'audit avant de transmettre le dossier à R3.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">
              Décision <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={decision === "validated" ? "default" : "outline"}
                className={
                  decision === "validated"
                    ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                    : ""
                }
                onClick={() => {
                  setDecision("validated");
                  setError("");
                }}
              >
                Valider
              </Button>
              <Button
                type="button"
                size="sm"
                variant={decision === "rejected" ? "destructive" : "outline"}
                onClick={() => setDecision("rejected")}
              >
                Rejeter
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="audit-payment-proof-observations" className="text-xs">
              Observations
              {decision === "rejected" ? (
                <> <span className="text-red-500">*</span></>
              ) : null}
            </Label>
            <Textarea
              id="audit-payment-proof-observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Motif du rejet, référence de paiement vérifiée..."
              rows={3}
              required={decision === "rejected"}
              className="text-sm"
            />
          </div>

          {error ? <ActionError message={error} /> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  En cours...
                </>
              ) : (
                "Enregistrer la décision"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── RecordR3AvisDialog ───────────────────────────────────────────────────────

export function RecordR3AvisDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (state: AdminInspectionState) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [decision, setDecision] = useState<"conforme" | "non_conforme">(
    "conforme",
  );
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setDecision("conforme");
    setObservations("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === "non_conforme" && !observations.trim()) {
      setError("Une observation est requise pour un avis non conforme.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("decision", decision);
      if (observations.trim()) formData.append("observations", observations.trim());
      const file = fileRef.current?.files?.[0];
      if (file) formData.append("file", file);

      const nextState = await recordR3Avis(dossierId, formData);
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible d'enregistrer l'avis R3."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) reset();
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer l'avis R3</DialogTitle>
          <DialogDescription>
            Reportez l'avis du processus R3 sur le niveau de conformité du
            postulant suite à la démonstration et inspection sur site.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">
              Avis <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={decision === "conforme" ? "default" : "outline"}
                className={
                  decision === "conforme"
                    ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                    : ""
                }
                onClick={() => {
                  setDecision("conforme");
                  setError("");
                }}
              >
                Conforme
              </Button>
              <Button
                type="button"
                size="sm"
                variant={decision === "non_conforme" ? "destructive" : "outline"}
                onClick={() => setDecision("non_conforme")}
              >
                Non conforme
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="r3-avis-file" className="text-xs">
              Rapport R3 (optionnel)
            </Label>
            <input
              id="r3-avis-file"
              ref={fileRef}
              type="file"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="r3-avis-observations" className="text-xs">
              Observations
              {decision === "non_conforme" ? (
                <> <span className="text-red-500">*</span></>
              ) : null}
            </Label>
            <Textarea
              id="r3-avis-observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Constats, réserves, écarts relevés..."
              rows={3}
              required={decision === "non_conforme"}
              className="text-sm"
            />
          </div>

          {error ? <ActionError message={error} /> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  En cours...
                </>
              ) : (
                "Enregistrer l'avis"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── CloseInspectionDialog ────────────────────────────────────────────────────

export function CloseInspectionDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (result: AdminInspectionCloseResult) => void;
}): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await closeInspectionPhase(dossierId);
      onOpenChange(false);
      onSuccess(result);
    } catch (err) {
      setError(extractError(err, "Impossible de clôturer la phase IV."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) setError("");
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Clôturer la Phase IV — Démonstration et inspection sur site
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. La phase IV sera marquée clôturée
            et la phase de délivrance sera déverrouillée.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
          L'avis R3 a été enregistré pour ce dossier. La phase peut être
          clôturée.
        </div>

        {error ? <ActionError message={error} /> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              "Clôturer la Phase IV"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
