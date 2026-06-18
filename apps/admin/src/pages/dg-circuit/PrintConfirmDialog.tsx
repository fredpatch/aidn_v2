import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DgCircuitTask } from "@/lib/api/dg-circuit.api";

export function PrintConfirmDialog({
  task,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  task: DgCircuitTask;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm();
          }}
        >
          <DialogHeader>
            <DialogTitle>Confirmer la mise en circuit DG</DialogTitle>
            <DialogDescription>
              {task.reference || task.subject}
            </DialogDescription>
          </DialogHeader>
          <p className="mt-4 text-sm text-muted-foreground">
            Confirmez que le document a quitte l'accueil et attend maintenant
            la signature DG.
          </p>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Oui, mettre en circuit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
