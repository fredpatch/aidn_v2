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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  recordFormalRequestDgDecision,
  recordFormalRequestDgReturn,
  sendFormalRequestToDg,
  uploadFormalRequestCourrier,
  type AdminFormalRequestCourrierSource,
  type AdminFormalRequestDgDecision,
  type AdminFormalRequestPhaseState,
} from "@/lib/api/dossiers.api";
import { extractError } from "@/lib/utils/error";
import { ActionError } from "./dossier-detail.helpers";

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
