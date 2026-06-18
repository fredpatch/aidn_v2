import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DgCircuitTask } from "@/lib/api/dg-circuit.api";

const physicalReceiptSchema = z.object({
  physicalDepositDate: z.string().min(1, "La date de depot est obligatoire."),
  file: z
    .custom<FileList>((value) => value instanceof FileList)
    .refine((files) => files.length > 0, {
      message: "Le scan du courrier est obligatoire.",
    }),
  officialReference: z.string().optional(),
  notes: z.string().optional(),
});

type PhysicalReceiptFormValues = z.infer<typeof physicalReceiptSchema>;

export function PhysicalReceiptDialog({
  task,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  task: DgCircuitTask;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}): React.JSX.Element {
  const form = useForm<PhysicalReceiptFormValues>({
    resolver: zodResolver(physicalReceiptSchema),
    defaultValues: {
      physicalDepositDate: new Date().toISOString().slice(0, 10),
      officialReference: "",
      notes: "",
    },
  });

  const submit = form.handleSubmit((values) => {
    const file = values.file.item(0);
    if (!file) return;

    const formData = new FormData();
    formData.set("physicalDepositDate", values.physicalDepositDate);
    formData.set("file", file);

    const officialReference = values.officialReference?.trim();
    if (officialReference) {
      formData.set("officialReference", officialReference);
    }

    const notes = values.notes?.trim();
    if (notes) {
      formData.set("notes", notes);
    }

    onSubmit(formData);
  });

  const dateError = form.formState.errors.physicalDepositDate?.message;
  const fileError = form.formState.errors.file?.message;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer la reception physique</DialogTitle>
          <DialogDescription>
            {task.reference || task.subject}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <fieldset disabled={isSubmitting} className="space-y-4">
            <FieldGroup className="gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field data-invalid={!!dateError}>
                  <FieldLabel htmlFor="receipt-date">
                    Date depot reel *
                  </FieldLabel>
                  <Input
                    id="receipt-date"
                    type="date"
                    aria-invalid={!!dateError}
                    {...form.register("physicalDepositDate")}
                  />
                  <FieldError>{dateError}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="receipt-reference">
                    Reference officielle
                  </FieldLabel>
                  <Input
                    id="receipt-reference"
                    {...form.register("officialReference")}
                  />
                </Field>
              </div>
              <Field data-invalid={!!fileError}>
                <FieldLabel htmlFor="receipt-file">Scan courrier *</FieldLabel>
                <Input
                  id="receipt-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  aria-invalid={!!fileError}
                  {...form.register("file")}
                />
                <FieldError>{fileError}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="receipt-notes">Notes</FieldLabel>
                <Textarea
                  id="receipt-notes"
                  rows={3}
                  {...form.register("notes")}
                />
              </Field>
            </FieldGroup>
          </fieldset>
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
