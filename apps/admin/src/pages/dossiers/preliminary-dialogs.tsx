import { useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarScheduler } from "@/components/ui/calendar-scheduler";
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
import {
  closePreliminaryPhase,
  publishPreEvaluationForm,
  recordPreEvalDgReturn,
  sendPreEvalToDg,
  uploadClosureCourrier,
} from "@/lib/api/dossiers.api";
import { ApiError } from "@/lib/api/client";
import { ActionError } from "./dossier-detail.helpers";

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: () => void;
};

function extractError(err: unknown): string {
  return err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.";
}

function buildScheduledAt(date: Date, timeStr: string): string {
  const match = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(timeStr);
  if (!match) return date.toISOString();
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (match[3] === "PM" && hours !== 12) hours += 12;
  if (match[3] === "AM" && hours === 12) hours = 0;
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result.toISOString();
}

// Planifier une réunion (première réunion de contact OU réunion préliminaire)
// onConfirm: caller decides which API to call (inviteFirstMeeting vs invitePreliminaryMeeting)
export function InviteMeetingDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: (payload: {
    scheduledAt?: string;
    location?: string;
    notes?: string;
  }) => Promise<unknown>;
  onSuccess: () => void;
}): React.JSX.Element {
  const [schedule, setSchedule] = useState<{
    date?: Date;
    time?: string;
  }>({});
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setSchedule({});
    setLocation("");
    setNotes("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const scheduledAt =
        schedule.date && schedule.time
          ? buildScheduledAt(schedule.date, schedule.time)
          : undefined;
      await onConfirm({
        scheduledAt,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err));
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <CalendarScheduler
            title=""
            showFooter={false}
            onChange={(val) => setSchedule(val)}
          />
          <div className="space-y-1">
            <Label htmlFor="inv-location" className="text-xs">
              Lieu (optionnel)
            </Label>
            <Input
              id="inv-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Salle de réunion, adresse…"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inv-notes" className="text-xs">
              Notes (optionnel)
            </Label>
            <Textarea
              id="inv-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
                  En cours…
                </>
              ) : (
                "Planifier la réunion"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Enregistrer la tenue d'une réunion (première réunion OU réunion préliminaire)
// onConfirm: caller decides which API to call
export function RecordMeetingDialog({
  open,
  onOpenChange,
  title,
  showVisibleToPostulant,
  onConfirm,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  showVisibleToPostulant?: boolean;
  onConfirm: (formData: FormData) => Promise<unknown>;
  onSuccess: () => void;
}): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [visibleToPostulant, setVisibleToPostulant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setNotes("");
    setVisibleToPostulant(false);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const file = fileRef.current?.files?.[0];
      if (!file) {
        setError("Le compte rendu est obligatoire pour enregistrer la tenue de la réunion.");
        setIsSubmitting(false);
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      if (notes.trim()) fd.append("notes", notes.trim());
      if (showVisibleToPostulant)
        fd.append("visibleToPostulant", String(visibleToPostulant));
      await onConfirm(fd);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err));
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
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="rec-file" className="text-xs">
              Compte rendu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="rec-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rec-notes" className="text-xs">
              Notes (optionnel)
            </Label>
            <Textarea
              id="rec-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
          {showVisibleToPostulant ? (
            <div className="flex items-center gap-2">
              <input
                id="rec-visible"
                type="checkbox"
                className="h-4 w-4"
                checked={visibleToPostulant}
                onChange={(e) => setVisibleToPostulant(e.target.checked)}
              />
              <Label htmlFor="rec-visible" className="text-xs">
                Rendre le compte rendu visible au postulant
              </Label>
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
                "Enregistrer la réunion"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Mettre le formulaire de pré-évaluation à disposition (confirmation simple)
export function PublishPreEvalDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await publishPreEvaluationForm(dossierId);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setError("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre le formulaire à disposition</DialogTitle>
          <DialogDescription>
            Le modèle de formulaire de pré-évaluation sera rendu accessible au
            postulant dans son espace portail. Confirmez-vous ?
          </DialogDescription>
        </DialogHeader>
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
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                En cours…
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mettre en circuit officiel DG (confirmation simple)
export function SendToDgDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await sendPreEvalToDg(dossierId, {});
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setError("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre en circuit officiel DG</DialogTitle>
          <DialogDescription>
            Imprimez le formulaire de pré-évaluation soumis, placez-le dans le
            circuit physique DG/parapheur, puis confirmez la mise en circuit.
          </DialogDescription>
        </DialogHeader>
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
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                En cours…
              </>
            ) : (
              "Marquer mis en circuit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Enregistrer le retour DG annoté
export function RecordDgReturnDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [returnedAt, setReturnedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReturnedAt("");
    setNotes("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const file = fileRef.current?.files?.[0];
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (returnedAt) fd.append("returnedAt", returnedAt);
      if (notes.trim()) fd.append("notes", notes.trim());
      await recordPreEvalDgReturn(dossierId, fd);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err));
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
          <DialogTitle>Enregistrer le retour DG annoté</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="dg-file" className="text-xs">
                Document retourné par le DG{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dg-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dg-returned-at" className="text-xs">
                Date de retour (optionnel)
              </Label>
              <Input
                id="dg-returned-at"
                type="date"
                value={returnedAt}
                onChange={(e) => setReturnedAt(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dg-notes" className="text-xs">
              Notes (optionnel)
            </Label>
            <Textarea
              id="dg-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
                  En cours…
                </>
              ) : (
                "Enregistrer le retour DG"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Téléverser le courrier de clôture
export function UploadClosureCourrierDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      await uploadClosureCourrier(dossierId, fd);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err));
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
          <DialogTitle>Téléverser le courrier de clôture</DialogTitle>
          <DialogDescription>
            Document de clôture de la phase préliminaire — sera visible au
            postulant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="cl-file" className="text-xs">
                Courrier de clôture <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cl-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cl-title" className="text-xs">
                Intitulé (optionnel)
              </Label>
              <Input
                id="cl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Courrier de clôture - Phase préliminaire"
                className="h-8 text-sm"
              />
            </div>
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
                  En cours…
                </>
              ) : (
                "Téléverser"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Confirmer la clôture de la phase préliminaire
export function ClosePreliminaryDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await closePreliminaryPhase(dossierId);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setError("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la clôture</DialogTitle>
          <DialogDescription>
            Clôturer la phase préliminaire est irréversible. La phase de demande
            formelle sera prête à démarrer, sans activer d'action Phase 2.
            Confirmez-vous ?
          </DialogDescription>
        </DialogHeader>
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
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? "Clôture en cours…" : "Confirmer la clôture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
