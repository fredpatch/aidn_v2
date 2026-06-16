import { useState } from "react";
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
  closeDocumentEvaluationPhase,
  reviewDocumentEvaluation,
  uploadStudyFeeInvoice,
  type AdminDocumentEvaluationItem,
  type AdminDocumentEvaluationPaymentState,
} from "@/lib/api/dossiers.api";
import { extractError } from "@/lib/utils/error";
import { ActionError } from "./dossier-detail.helpers";
import { UploadDocumentDialog } from "./components/UploadDocumentDialog";

// ── UploadInvoiceDialog ───────────────────────────────────────────────────────

export function UploadInvoiceDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (state: AdminDocumentEvaluationPaymentState) => void;
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
    const nextState = await uploadStudyFeeInvoice(dossierId, formData);
    onSuccess(nextState);
  };

  return (
    <UploadDocumentDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Téléverser la facture des frais d'étude"
      description="Joignez la facture émise par le S5. Le postulant sera notifié pour effectuer le paiement."
      fileLabel="Facture"
      dateLabel="Date d'émission"
      notesLabel="Notes"
      submitLabel="Téléverser la facture"
      onSubmit={handleSubmit}
    />
  );
}

// ── ReviewDocumentDialog ──────────────────────────────────────────────────────

export function ReviewDocumentDialog({
  open,
  onOpenChange,
  dossierId,
  evaluation,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  evaluation: AdminDocumentEvaluationItem | null;
  onSuccess: () => void;
}): React.JSX.Element {
  const [reviewStatus, setReviewStatus] = useState<
    "satisfaisant" | "non_satisfaisant"
  >(evaluation?.status === "satisfaisant" ? "satisfaisant" : "non_satisfaisant");
  const [annotation, setAnnotation] = useState(evaluation?.annotation ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReviewStatus("non_satisfaisant");
    setAnnotation("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewStatus === "non_satisfaisant" && !annotation.trim()) {
      setError("Une annotation est requise pour un résultat non satisfaisant.");
      return;
    }
    if (!evaluation) return;

    setIsSubmitting(true);
    setError("");
    try {
      await reviewDocumentEvaluation(dossierId, evaluation.id, {
        status: reviewStatus,
        annotation: annotation.trim() || undefined,
      });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err, "Impossible d'enregistrer l'évaluation."));
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
          <DialogTitle>Évaluer le document</DialogTitle>
          {evaluation?.requirement?.label ? (
            <DialogDescription>
              {evaluation.requirement.label}
              {evaluation.requirement.code ? (
                <span className="ml-2 font-mono text-xs">
                  {evaluation.requirement.code}
                </span>
              ) : null}
            </DialogDescription>
          ) : null}
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
                variant={reviewStatus === "satisfaisant" ? "default" : "outline"}
                className={
                  reviewStatus === "satisfaisant"
                    ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                    : ""
                }
                onClick={() => {
                  setReviewStatus("satisfaisant");
                  setError("");
                }}
              >
                Satisfaisant
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  reviewStatus === "non_satisfaisant" ? "destructive" : "outline"
                }
                onClick={() => setReviewStatus("non_satisfaisant")}
              >
                Non satisfaisant
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="review-annotation" className="text-xs">
              Annotation DN
              {reviewStatus === "non_satisfaisant" ? (
                <> <span className="text-red-500">*</span></>
              ) : null}
            </Label>
            <Textarea
              id="review-annotation"
              value={annotation}
              onChange={(e) => setAnnotation(e.target.value)}
              placeholder="Observations, corrections demandées..."
              rows={3}
              required={reviewStatus === "non_satisfaisant"}
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
                "Enregistrer l'évaluation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── CloseDocumentEvaluationDialog ─────────────────────────────────────────────

export function CloseDocumentEvaluationDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: () => void;
}): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await closeDocumentEvaluationPhase(dossierId);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err, "Impossible de clôturer la phase III."));
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
            Clôturer la Phase III — Évaluation approfondie
          </DialogTitle>
          <DialogDescription>
            Cette action est irréversible. La phase III sera marquée clôturée et
            la phase d'inspection sera déverrouillée.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
          Toutes les évaluations de documents ont été validées comme
          satisfaisantes. La phase peut être clôturée.
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
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              "Clôturer la Phase III"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
