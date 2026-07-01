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
  advanceCertificateLifecycle,
  closeDeliveryPhase,
  uploadCertificateDeliveryFeeInvoice,
  validateCertificateDeliveryFeePaymentProof,
  type AdminCertificate,
  type AdminDeliveryCloseResult,
  type AdminDeliveryState,
} from "@/lib/api/dossiers";
import { extractError } from "@/lib/utils/error";
import { ActionError } from "./dossier-detail.helpers";
import { UploadDocumentDialog } from "./components/UploadDocumentDialog";

// ── UploadCertificateFeeInvoiceDialog ───────────────────────────────────────

export function UploadCertificateFeeInvoiceDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (state: AdminDeliveryState) => void;
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
    const nextState = await uploadCertificateDeliveryFeeInvoice(
      dossierId,
      formData,
    );
    onSuccess(nextState);
  };

  return (
    <UploadDocumentDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Téléverser la facture des frais de délivrance"
      description="Joignez la facture émise par le S5 pour la délivrance du certificat. Le postulant sera notifié pour effectuer le paiement."
      fileLabel="Facture"
      dateLabel="Date d'émission"
      notesLabel="Notes"
      submitLabel="Téléverser la facture"
      onSubmit={handleSubmit}
    />
  );
}

// ── ValidateCertificateFeePaymentProofDialog ────────────────────────────────

export function ValidateCertificateFeePaymentProofDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (state: AdminDeliveryState) => void;
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
      const nextState = await validateCertificateDeliveryFeePaymentProof(
        dossierId,
        { decision, observations: observations.trim() || undefined },
      );
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
          <DialogTitle>Valider la preuve de paiement (délivrance)</DialogTitle>
          <DialogDescription>
            Confirmez que la quittance déposée correspond bien au paiement
            des frais de délivrance. La validation démarre la préparation du
            certificat.
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
            <Label htmlFor="cert-payment-proof-observations" className="text-xs">
              Observations
              {decision === "rejected" ? (
                <> <span className="text-red-500">*</span></>
              ) : null}
            </Label>
            <Textarea
              id="cert-payment-proof-observations"
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

// ── AdvanceCertificateDialog ─────────────────────────────────────────────────
// One generic dialog for every certificate lifecycle transition. Only two
// transitions need extra input: uploading the signed certificate (file
// required - this single action both archives it and marks the certificate
// ready for pickup) and confirming collection (optional note, no "collected
// by" field since the postulant is the only valid collector).

const ADVANCE_ACTION_CONFIG: Record<
  string,
  { title: string; description: string; buttonLabel: string; requiresFile?: boolean; isCollection?: boolean }
> = {
  to_prepare: {
    title: "Marquer le certificat imprimé",
    description:
      "Confirmez que les informations du certificat ont été vérifiées et que le document a été imprimé.",
    buttonLabel: "Marquer imprimé",
  },
  printed: {
    title: "Marquer envoyé pour signature DG",
    description:
      "Confirmez que le certificat imprimé a été envoyé physiquement pour signature au DG.",
    buttonLabel: "Marquer envoyé pour signature",
  },
  sent_for_dg_signature: {
    title: "Téléverser le certificat signé",
    description:
      "Une fois le certificat signé par le DG et retourné à la DN, téléversez-le ici. Cette action archive le document et marque le certificat prêt au retrait en une seule étape.",
    buttonLabel: "Téléverser et marquer prêt au retrait",
    requiresFile: true,
  },
  ready_for_collection: {
    title: "Confirmer le retrait par le postulant",
    description:
      "Le certificat ne peut être retiré que par le postulant en personne. Vérifiez son identité avant de confirmer.",
    buttonLabel: "Confirmer le retrait",
    isCollection: true,
  },
  collected: {
    title: "Archiver le certificat",
    description: "Marquer ce certificat comme archivé.",
    buttonLabel: "Archiver",
  },
};

export function AdvanceCertificateDialog({
  open,
  onOpenChange,
  certificate,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: AdminCertificate | null;
  onSuccess: (certificate: AdminCertificate) => void;
}): React.JSX.Element | null {
  const fileRef = useRef<HTMLInputElement>(null);
  const [collectionNote, setCollectionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!certificate) return null;
  const config = ADVANCE_ACTION_CONFIG[certificate.status];
  if (!config) return null;

  const reset = () => {
    setCollectionNote("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (config.requiresFile && !file) {
      setError("Un fichier est requis pour cette étape.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (config.isCollection && collectionNote.trim()) {
        formData.append("collectionNote", collectionNote.trim());
      }
      const { certificate: nextCertificate } = await advanceCertificateLifecycle(
        certificate.id,
        formData,
      );
      reset();
      onOpenChange(false);
      onSuccess(nextCertificate);
    } catch (err) {
      setError(extractError(err, "Impossible d'enregistrer cette étape."));
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
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {config.requiresFile ? (
            <div className="space-y-1">
              <Label htmlFor="certificate-signed-file" className="text-xs">
                Certificat signé <span className="text-red-500">*</span>
              </Label>
              <input
                id="certificate-signed-file"
                ref={fileRef}
                type="file"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          ) : null}

          {config.isCollection ? (
            <div className="space-y-1">
              <Label htmlFor="collection-note" className="text-xs">
                Note (optionnel)
              </Label>
              <Textarea
                id="collection-note"
                value={collectionNote}
                onChange={(e) => setCollectionNote(e.target.value)}
                placeholder="Pièce d'identité vérifiée, remarque particulière..."
                rows={2}
                className="text-sm"
              />
            </div>
          ) : null}

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
                config.buttonLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── CloseDeliveryDialog ──────────────────────────────────────────────────────

export function CloseDeliveryDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (result: AdminDeliveryCloseResult) => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      const file = fileRef.current?.files?.[0];
      if (file) formData.append("file", file);
      const result = await closeDeliveryPhase(dossierId, formData);
      reset();
      onOpenChange(false);
      onSuccess(result);
    } catch (err) {
      setError(extractError(err, "Impossible de clôturer la phase V."));
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
          <DialogTitle>Clôturer la Phase V — Délivrance</DialogTitle>
          <DialogDescription>
            Le certificat a été retiré par le postulant. Cette action clôture
            définitivement le dossier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <Label htmlFor="delivery-closure-file" className="text-xs">
            Lettre de clôture + approbations (optionnel)
          </Label>
          <input
            id="delivery-closure-file"
            ref={fileRef}
            type="file"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
            accept=".pdf,.jpg,.jpeg,.png"
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
              "Clôturer le dossier"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
