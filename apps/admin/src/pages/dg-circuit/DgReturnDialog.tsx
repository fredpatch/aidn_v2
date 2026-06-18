import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentFileField } from "@/components/documents/DocumentFileField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DgCircuitTask } from "@/lib/api/dg-circuit.api";

import { buildDgReturnFormData } from "./helpers";
import { Loader } from "lucide-react";

const dgReturnSchema = z.object({
  file: z.custom<File>((value) => value instanceof File, {
    message: "Le document signe par le DG est obligatoire.",
  }),
  returnedAt: z.string().optional(),
});

type DgReturnFormValues = z.infer<typeof dgReturnSchema>;

export function DgReturnDialog({
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
  const form = useForm<DgReturnFormValues>({
    resolver: zodResolver(dgReturnSchema),
    defaultValues: {
      file: null as unknown as File,
      returnedAt: new Date().toISOString().slice(0, 10),
    },
  });

  const submit = form.handleSubmit((values) => {
    onSubmit(
      buildDgReturnFormData({
        source: task.source,
        file: values.file,
        returnedAt: values.returnedAt,
      }),
    );
  });

  const file = form.watch("file");
  const fileError = form.formState.errors.file?.message;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Televerser le document signe DG</DialogTitle>
          <DialogDescription>
            {task.reference || task.subject}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <fieldset disabled={isSubmitting} className="space-y-4">
            <FieldGroup className="gap-4">
              <Controller
                control={form.control}
                name="file"
                render={({ field }) => (
                  <DocumentFileField
                    id="dg-return-file"
                    label="Document signe DG"
                    badge={<Badge variant="destructive">Obligatoire</Badge>}
                    file={field.value ?? null}
                    disabled={isSubmitting}
                    error={fileError}
                    onFileChange={field.onChange}
                  />
                )}
              />
              <Field>
                <FieldLabel htmlFor="dg-return-date">
                  Date signature
                  <Badge variant="secondary">Optionnel</Badge>
                </FieldLabel>
                <Input
                  id="dg-return-date"
                  type="date"
                  {...form.register("returnedAt")}
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
            <Button type="submit" disabled={isSubmitting || !file}>
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
