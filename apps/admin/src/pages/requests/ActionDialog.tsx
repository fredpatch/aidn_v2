import { AlertCircle, FolderOpen, MessageSquareWarning } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useAppToast } from "../../hooks/useAppToast";
import { isMockMode } from "../../lib/data/data-mode";
import { useOpenDossierDn, useRequestCorrection } from "../../lib/query";
import { type AdminRequest } from "../../lib/api/requests";
import { optional } from "./requests.utils";

export type ActionDialogState = {
  kind: "open_dossier" | "correction";
  request: AdminRequest;
};

export function ActionDialog({
  state,
  onClose,
  onDone,
}: {
  state: ActionDialogState;
  onClose: () => void;
  onDone: (id: string, message: string) => void;
}) {
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState("");
  const toast = useAppToast();

  const openDossierMutation = useOpenDossierDn();
  const correctionMutation = useRequestCorrection();

  const copy = {
    open_dossier: {
      title: "Démarrer la phase préliminaire",
      description:
        "Confirmer le démarrage de la phase préliminaire pour cette demande",
      label: "Notes",
      button: "Démarrer la phase préliminaire",
      success: "Phase préliminaire démarrée.",
      icon: FolderOpen,
    },
    correction: {
      title: "Demander correction",
      description: "Indiquer le motif de correction à envoyer au postulant",
      label: "Motif de correction",
      button: "Demander correction",
      success: "Correction demandée au postulant.",
      icon: MessageSquareWarning,
    },
  }[state.kind];
  const Icon = copy.icon;

  const isSubmitting =
    openDossierMutation.isPending || correctionMutation.isPending;

  const handleSubmit = async () => {
    setLocalError("");

    if (state.kind === "correction" && !text.trim()) {
      setLocalError("Le motif est requis.");
      return;
    }

    try {
      if (isMockMode()) {
        toast.success(copy.success);
        onDone(state.request.id, copy.success);
        return;
      }

      if (state.kind === "open_dossier") {
        await openDossierMutation.mutateAsync({
          id: state.request.id,
          payload: { notes: optional(text) },
        });
      } else if (state.kind === "correction") {
        await correctionMutation.mutateAsync({
          id: state.request.id,
          payload: { reason: text.trim() },
        });
      }

      toast.success(copy.success);
      onDone(state.request.id, copy.success);
    } catch (error) {
      const errorMessage = "Action impossible sur cette demande.";
      setLocalError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" aria-hidden="true" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Demande
            </p>
            <p className="text-sm text-slate-900 dark:text-white">
              {state.request.subject}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="action-notes">{copy.label}</Label>
              {state.kind === "open_dossier" ? (
                <Badge variant="secondary">Optionnel</Badge>
              ) : (
                <Badge variant="destructive">Obligatoire</Badge>
              )}
            </div>
            <Textarea
              id="action-notes"
              placeholder={
                state.kind === "open_dossier"
                  ? "Ajouter des notes facultatives..."
                  : "Expliquer les corrections demandées..."
              }
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={isSubmitting}
              className="min-h-32"
            />
          </div>

          {localError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="destructive"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={
              state.kind === "open_dossier"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : undefined
            }
          >
            <Icon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Traitement..." : copy.button}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
