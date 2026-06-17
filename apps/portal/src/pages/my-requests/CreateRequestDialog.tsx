import { FilePlus2, Loader2 } from "lucide-react";
import {
  Controller,
  useForm,
  type RegisterOptions,
  type SubmitHandler,
} from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { getRequestTypeLabel } from "../../components/RequestTypeLabel";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Field, FieldError, FieldLabel } from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { PortalApiError } from "../../lib/api/http";
import type { PortalRequestType } from "../../lib/api/requests";
import { useCreatePortalRequest } from "../../lib/query";
import { portalRoutes } from "../../lib/routes";

type CreateRequestForm = {
  requestType: PortalRequestType | "";
  subject: string;
  message: string;
};

const requestTypeOptions: Array<{ value: PortalRequestType; label: string }> = [
  { value: "oma_recognition", label: getRequestTypeLabel("oma_recognition") },
  { value: "oma_approval", label: getRequestTypeLabel("oma_approval") },
  { value: "oma_renewal", label: getRequestTypeLabel("oma_renewal") },
  { value: "oma_modification", label: getRequestTypeLabel("oma_modification") },
];

const defaultValues: CreateRequestForm = {
  requestType: "",
  subject: "",
  message: "",
};

const messageMaxLength = 300;
const requiredBadge = <Badge variant="destructive">Requis</Badge>;
const optionalBadge = <Badge variant="outline">Optionnel</Badge>;

const rules = {
  requestType: {
    required: "Le type de demande est requis.",
  },
  subject: {
    required: "L'objet de la demande est requis.",
    minLength: {
      value: 3,
      message: "L'objet doit contenir au moins 3 caracteres.",
    },
    maxLength: {
      value: 200,
      message: "L'objet doit contenir au plus 200 caracteres.",
    },
  },
  message: {
    maxLength: {
      value: messageMaxLength,
      message: `Le message doit contenir au plus ${messageMaxLength} caracteres.`,
    },
  },
} satisfies Record<keyof CreateRequestForm, RegisterOptions<CreateRequestForm>>;

function getErrorMessage(caught: unknown): string {
  return caught instanceof PortalApiError
    ? caught.message
    : "Impossible de creer la demande pour le moment.";
}

export function CreateRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  const navigate = useNavigate();
  const createRequest = useCreatePortalRequest();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestForm>({
    defaultValues,
    mode: "onBlur",
  });
  const isBusy = isSubmitting || createRequest.isPending;
  const messageLength = watch("message").length;
  const remainingMessageCharacters = messageMaxLength - messageLength;

  const onSubmit: SubmitHandler<CreateRequestForm> = async (form) => {
    if (!form.requestType) {
      return;
    }

    const creationToastId = toast.loading("Creation de la demande...", {
      description: "Nous preparons votre brouillon.",
    });

    try {
      const { request } = await createRequest.mutateAsync({
        requestType: form.requestType,
        subject: form.subject.trim(),
        message: form.message.trim() || undefined,
      });
      reset(defaultValues);
      onOpenChange(false);
      toast.success("Brouillon cree", {
        id: creationToastId,
        description: "Vous pouvez maintenant completer le courrier initial.",
      });
      navigate(portalRoutes.requestDetail(request.id));
    } catch (caught) {
      toast.error("Creation impossible", {
        id: creationToastId,
        description: getErrorMessage(caught),
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          reset(defaultValues);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle demande</DialogTitle>
          <DialogDescription>
            Creez un brouillon en quelques champs. Vous pourrez ajouter le
            courrier initial a l'etape suivante.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          noValidate
        >
          <Field>
            <FieldLabel htmlFor="requestType">
              Type de demande
              {requiredBadge}
            </FieldLabel>
            <Controller
              name="requestType"
              control={control}
              rules={rules.requestType}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isBusy}
                >
                  <SelectTrigger
                    id="requestType"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={errors.requestType ? "true" : "false"}
                    aria-describedby={
                      errors.requestType ? "requestType-error" : undefined
                    }
                    className={
                      errors.requestType
                        ? "border-red-300 bg-red-50/40"
                        : undefined
                    }
                  >
                    <SelectValue placeholder="Selectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {requestTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="requestType-error">
              {errors.requestType?.message}
            </FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">
              Objet de la demande
              {requiredBadge}
            </FieldLabel>
            <Input
              id="subject"
              type="text"
              maxLength={200}
              disabled={isBusy}
              invalid={Boolean(errors.subject)}
              aria-invalid={errors.subject ? "true" : "false"}
              aria-describedby={errors.subject ? "subject-error" : undefined}
              placeholder="Ex. Demande de certificat OMA"
              {...register("subject", rules.subject)}
            />
            <FieldError id="subject-error">
              {errors.subject?.message}
            </FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="message">
              Message complementaire
              {optionalBadge}
            </FieldLabel>
            <textarea
              id="message"
              rows={4}
              maxLength={messageMaxLength}
              disabled={isBusy}
              className={[
                "min-h-28 w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
                errors.message
                  ? "border-red-300 bg-red-50/40"
                  : "border-slate-300",
                "focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10",
              ].join(" ")}
              aria-invalid={errors.message ? "true" : "false"}
              aria-describedby={errors.message ? "message-error" : undefined}
              placeholder="Ajoutez une precision utile pour l'instruction du dossier."
              {...register("message", rules.message)}
            />
            <div className="flex items-start justify-between gap-3">
              <FieldError id="message-error">
                {errors.message?.message}
              </FieldError>
              <p className="ml-auto shrink-0 text-xs font-medium text-slate-500">
                {remainingMessageCharacters} caracteres restants
              </p>
            </div>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Creation...
                </>
              ) : (
                <>
                  <FilePlus2 aria-hidden="true" />
                  Creer le brouillon
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
