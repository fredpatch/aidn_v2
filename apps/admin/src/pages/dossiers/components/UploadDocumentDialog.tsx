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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionError } from "../dossier-detail.helpers";

export type UploadDocumentDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  fileLabel?: string;
  dateLabel?: string;
  notesLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  requireDate?: boolean;
  requireNotes?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    file: File;
    date?: string;
    notes?: string;
  }) => Promise<void> | void;
};

export function UploadDocumentDialog({
  open,
  title,
  description,
  fileLabel = "Document",
  dateLabel,
  notesLabel,
  submitLabel = "Enregistrer",
  requireDate = false,
  requireNotes = false,
  onOpenChange,
  onSubmit,
}: UploadDocumentDialogProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDate("");
    setNotes("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }
    if (requireDate && !date) {
      setError("Veuillez renseigner la date.");
      return;
    }
    if (requireNotes && !notes.trim()) {
      setError("Veuillez renseigner les observations.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        file,
        date: date || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className={dateLabel ? "grid gap-3 sm:grid-cols-2" : undefined}>
            <div className="space-y-1">
              <Label htmlFor="upload-file" className="text-xs">
                {fileLabel} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="upload-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
                className="h-8 text-sm"
              />
            </div>
            {dateLabel ? (
              <div className="space-y-1">
                <Label htmlFor="upload-date" className="text-xs">
                  {dateLabel}
                  {requireDate ? (
                    <> <span className="text-red-500">*</span></>
                  ) : null}
                </Label>
                <Input
                  id="upload-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required={requireDate}
                  className="h-8 text-sm"
                />
              </div>
            ) : null}
          </div>
          {notesLabel ? (
            <div className="space-y-1">
              <Label htmlFor="upload-notes" className="text-xs">
                {notesLabel}
                {requireNotes ? (
                  <> <span className="text-red-500">*</span></>
                ) : null}
              </Label>
              <Textarea
                id="upload-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                required={requireNotes}
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
                  En cours…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
