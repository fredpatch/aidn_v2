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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  closeFormalRequestPhase,
  inviteFormalMeeting,
  markFormalMeetingHeld,
  recordFormalRequestDgDecision,
  recordFormalRequestDgReturn,
  sendFormalRequestToDg,
  uploadFormalMeetingReport,
  uploadFormalRequestCourrier,
  type AdminFormalRequestCourrierSource,
  type AdminFormalRequestDgDecision,
  type AdminFormalRequestPhaseState,
  type AdminFormalRequestRequirement,
} from "@/lib/api/dossiers.api";
import { extractError } from "@/lib/utils/error";
import { ActionError } from "./dossier-detail.helpers";

function buildScheduledAt(date: Date, timeStr: string): string {
  const match = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(timeStr);
  if (!match) return date.toISOString();
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  onSuccess: (state: AdminFormalRequestPhaseState) => void;
};

const sourceLabels: Record<AdminFormalRequestCourrierSource, string> = {
  physical_deposit: "Dépôt physique",
  internal_scan: "Scan interne",
};

const decisionLabels: Record<AdminFormalRequestDgDecision, string> = {
  approved: "Approuvé",
  rejected: "Rejeté",
  reoriented: "Réorienté",
  pending: "En attente",
};

export function RegisterFormalCourrierDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] =
    useState<AdminFormalRequestCourrierSource>("physical_deposit");
  const [officialReference, setOfficialReference] = useState("");
  const [physicalDepositDate, setPhysicalDepositDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setSource("physical_deposit");
    setOfficialReference("");
    setPhysicalDepositDate("");
    setNotes("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", source);
      if (officialReference.trim()) {
        formData.append("officialReference", officialReference.trim());
      }
      if (physicalDepositDate) {
        formData.append("physicalDepositDate", physicalDepositDate);
      }
      if (notes.trim()) formData.append("notes", notes.trim());

      const nextState = await uploadFormalRequestCourrier(dossierId, formData);
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible d'enregistrer le courrier formel."));
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
          <DialogTitle>Scanner / enregistrer un courrier reçu hors portail</DialogTitle>
          <DialogDescription>
            À utiliser uniquement si la demande formelle a été reçue
            physiquement ou scannée en interne. Si le postulant téléverse sa
            demande depuis le portail, elle apparaîtra automatiquement ici.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="formal-courrier-file" className="text-xs">
                Fichier <span className="text-red-500">*</span>
              </Label>
              <Input
                id="formal-courrier-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formal-courrier-source" className="text-xs">
                Source <span className="text-red-500">*</span>
              </Label>
              <Select
                value={source}
                onValueChange={(value) =>
                  setSource(value as AdminFormalRequestCourrierSource)
                }
              >
                <SelectTrigger id="formal-courrier-source" className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="formal-courrier-reference" className="text-xs">
                Référence officielle
              </Label>
              <Input
                id="formal-courrier-reference"
                value={officialReference}
                onChange={(event) => setOfficialReference(event.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formal-courrier-date" className="text-xs">
                Date de dépôt physique
              </Label>
              <Input
                id="formal-courrier-date"
                type="date"
                value={physicalDepositDate}
                onChange={(event) => setPhysicalDepositDate(event.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="formal-courrier-notes" className="text-xs">
              Notes
            </Label>
            <Textarea
              id="formal-courrier-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
                  En cours...
                </>
              ) : (
                "Scanner / enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SendFormalToDgDialog({
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
      const nextState = await sendFormalRequestToDg(dossierId);
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(
        extractError(err, "Impossible de mettre la demande formelle en circuit DG."),
      );
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
          <DialogTitle>Mettre en circuit DG</DialogTitle>
          <DialogDescription>
            Imprimez le courrier de demande formelle, placez-le dans le circuit
            physique DG/parapheur, puis marquez cette étape comme mise en
            circuit.
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
                En cours...
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

export function RecordFormalDgReturnDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [returnedFromDgAt, setReturnedFromDgAt] = useState("");
  const [officialReference, setOfficialReference] = useState("");
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReturnedFromDgAt("");
    setOfficialReference("");
    setObservations("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner le retour DG scanné.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (returnedFromDgAt) formData.append("returnedFromDgAt", returnedFromDgAt);
      if (officialReference.trim()) {
        formData.append("officialReference", officialReference.trim());
      }
      if (observations.trim()) formData.append("notes", observations.trim());

      const nextState = await recordFormalRequestDgReturn(dossierId, formData);
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible d'enregistrer le retour DG scanné."));
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
          <DialogTitle>Enregistrer le retour DG scanné</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="formal-dg-return-file" className="text-xs">
                Fichier retour DG scanné <span className="text-red-500">*</span>
              </Label>
              <Input
                id="formal-dg-return-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formal-dg-return-date" className="text-xs">
                Date retour DG
              </Label>
              <Input
                id="formal-dg-return-date"
                type="date"
                value={returnedFromDgAt}
                onChange={(event) => setReturnedFromDgAt(event.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="formal-dg-return-reference" className="text-xs">
                Référence officielle
              </Label>
              <Input
                id="formal-dg-return-reference"
                value={officialReference}
                onChange={(event) => setOfficialReference(event.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="formal-dg-observations" className="text-xs">
              Observations
            </Label>
            <Textarea
              id="formal-dg-observations"
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
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
                  En cours...
                </>
              ) : (
                "Enregistrer le retour DG scanné"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RecordFormalDgDecisionDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const [decision, setDecision] =
    useState<AdminFormalRequestDgDecision>("approved");
  const [decisionRecordedAt, setDecisionRecordedAt] = useState("");
  const [orientedDirection, setOrientedDirection] = useState("");
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setDecision("approved");
    setDecisionRecordedAt("");
    setOrientedDirection("");
    setObservations("");
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const nextState = await recordFormalRequestDgDecision(dossierId, {
        decision,
        orientedDirection: orientedDirection.trim() || undefined,
        observations: observations.trim() || undefined,
        decisionRecordedAt: decisionRecordedAt || undefined,
      });
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible d'enregistrer la décision DG."));
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
          <DialogTitle>Enregistrer la décision DG</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="formal-dg-decision" className="text-xs">
                Décision <span className="text-red-500">*</span>
              </Label>
              <Select
                value={decision}
                onValueChange={(value) =>
                  setDecision(value as AdminFormalRequestDgDecision)
                }
              >
                <SelectTrigger id="formal-dg-decision" className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(decisionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="formal-dg-decision-date" className="text-xs">
                Date décision DG
              </Label>
              <Input
                id="formal-dg-decision-date"
                type="date"
                value={decisionRecordedAt}
                onChange={(event) => setDecisionRecordedAt(event.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="formal-dg-oriented-direction" className="text-xs">
              Direction orientée
            </Label>
            <Input
              id="formal-dg-oriented-direction"
              value={orientedDirection}
              onChange={(event) => setOrientedDirection(event.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="formal-dg-decision-observations" className="text-xs">
              Observations
            </Label>
            <Textarea
              id="formal-dg-decision-observations"
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
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
                  En cours...
                </>
              ) : (
                "Enregistrer la décision DG"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InviteFormalMeetingDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const [schedule, setSchedule] = useState<{ date?: Date; time?: string }>({});
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const scheduledAt =
        schedule.date && schedule.time
          ? buildScheduledAt(schedule.date, schedule.time)
          : schedule.date?.toISOString();
      const nextState = await inviteFormalMeeting(dossierId, {
        scheduledAt,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible de planifier la réunion formelle."));
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Planifier la réunion formelle</DialogTitle>
          <DialogDescription>
            Choisissez une date, une heure et un lieu pour la réunion formelle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <CalendarScheduler
            title=""
            showFooter={false}
            onChange={(val) => setSchedule(val)}
          />
          <div className="space-y-1">
            <Label htmlFor="formal-meeting-location" className="text-xs">
              Lieu
            </Label>
            <Input
              id="formal-meeting-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Salle de réunion, adresse..."
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="formal-meeting-notes" className="text-xs">
              Notes
            </Label>
            <Textarea
              id="formal-meeting-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
                  En cours...
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

export function MarkFormalMeetingHeldDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const [heldAt, setHeldAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setHeldAt("");
    setNotes("");
    setError("");
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const nextState = await markFormalMeetingHeld(dossierId, {
        heldAt: heldAt || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible de marquer la réunion comme tenue."));
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
          <DialogTitle>Marquer la réunion formelle comme tenue</DialogTitle>
          <DialogDescription>
            Confirmez que la réunion formelle a été tenue. Vous pourrez ensuite
            joindre le compte rendu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="formal-meeting-held-at" className="text-xs">
              Date de tenue
            </Label>
            <Input
              id="formal-meeting-held-at"
              type="date"
              value={heldAt}
              onChange={(event) => setHeldAt(event.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="formal-meeting-held-notes" className="text-xs">
              Notes
            </Label>
            <Textarea
              id="formal-meeting-held-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="text-sm"
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
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              "Confirmer la tenue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UploadFormalMeetingReportDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
}: BaseProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setNotes("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Veuillez sélectionner le compte rendu de réunion.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (notes.trim()) formData.append("notes", notes.trim());
      const nextState = await uploadFormalMeetingReport(dossierId, formData);
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible de joindre le compte rendu."));
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
          <DialogTitle>Joindre le compte rendu de réunion formelle</DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="formal-meeting-report-file" className="text-xs">
              Compte rendu <span className="text-red-500">*</span>
            </Label>
            <Input
              id="formal-meeting-report-file"
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="formal-meeting-report-notes" className="text-xs">
              Notes
            </Label>
            <Textarea
              id="formal-meeting-report-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
                  En cours...
                </>
              ) : (
                "Joindre le compte rendu"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CloseFormalRequestPhaseDialogProps = BaseProps & {
  progress: AdminFormalRequestPhaseState["progress"];
  omaApprovalFormRequirement?: AdminFormalRequestRequirement;
};

export function CloseFormalRequestPhaseDialog({
  open,
  onOpenChange,
  dossierId,
  onSuccess,
  progress,
  omaApprovalFormRequirement,
}: CloseFormalRequestPhaseDialogProps): React.JSX.Element {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Closure requires all required docs deposited AND oma_approval_form validated.
  const omaFormValidated = omaApprovalFormRequirement?.status === "validated";
  const hasMissingDocs = progress.missing > 0;
  const isComplete = omaFormValidated && !hasMissingDocs;

  const reset = () => {
    setNotes("");
    setError("");
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const nextState = await closeFormalRequestPhase(dossierId, {
        notes: notes.trim() || undefined,
      });
      reset();
      onOpenChange(false);
      onSuccess(nextState);
    } catch (err) {
      setError(extractError(err, "Impossible de clôturer la phase 2."));
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
          <DialogTitle>Clôturer la Phase 2 — Demande formelle</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. La phase 2 sera marquée clôturée et
            la phase 3 (Évaluation documentaire) sera déverrouillée.
          </DialogDescription>
        </DialogHeader>

        {/* Document completeness summary */}
        <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pièces justificatives
          </p>
          <p className="text-foreground">
            <span className="font-medium">{progress.totalTracked}</span> pièces suivies
            {" · "}
            <span className="font-medium">{progress.submitted}</span> déposée{progress.submitted !== 1 ? "s" : ""}
            {progress.missing > 0 ? (
              <>
                {" · "}
                <span className="font-medium text-destructive">
                  {progress.missing} manquante{progress.missing !== 1 ? "s" : ""}
                </span>
              </>
            ) : null}
          </p>
          {omaApprovalFormRequirement ? (
            <p className="text-foreground">
              Formulaire DN-AIR-R2-3-F-E-010 :{" "}
              <span
                className={
                  omaFormValidated
                    ? "font-medium text-emerald-700"
                    : omaApprovalFormRequirement.status === "requires_correction" ||
                        omaApprovalFormRequirement.status === "incomplete"
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                }
              >
                {omaFormValidated
                  ? "Validé"
                  : omaApprovalFormRequirement.status === "requires_correction"
                    ? "Correction demandée"
                    : omaApprovalFormRequirement.status === "incomplete"
                      ? "Incomplet"
                      : omaApprovalFormRequirement.status === "submitted" ||
                          omaApprovalFormRequirement.status === "under_review"
                        ? "Déposé — décision DN en attente"
                        : "Non déposé"}
              </span>
            </p>
          ) : null}
        </div>

        {/* Blocking message — closure not possible until conditions are met */}
        {!isComplete ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {!omaFormValidated && hasMissingDocs
              ? "Des pièces sont manquantes et le formulaire DN-AIR-R2-3-F-E-010 n'est pas validé. La clôture est impossible."
              : !omaFormValidated
                ? "Le formulaire DN-AIR-R2-3-F-E-010 doit être validé avant clôture."
                : "Toutes les pièces requises doivent être déposées avant de clôturer la phase."}
          </div>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor="formal-close-notes" className="text-xs">
            Notes de clôture (optionnel)
          </Label>
          <Textarea
            id="formal-close-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
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
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting || !isComplete}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              "Clôturer la Phase 2"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
