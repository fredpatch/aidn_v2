import { useState } from "react";
import {
  useForm,
  type RegisterOptions,
  type SubmitHandler,
} from "react-hook-form";
import { toast } from "sonner";

import {
  submitAccountRequest,
  type SubmitAccountRequestPayload,
} from "../lib/api/portal.api";
import { PortalApiError } from "../lib/api/http";
import { Badge } from "../components/ui/badge";
import { Field, FieldError, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type AccountRequestForm = {
  requestedOrganizationName: string;
  requestedLegalAddress: string;
  requestedEmail: string;
  requestedPhone: string;
  approvalNumberOrigin: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone: string;
  password: string;
  confirmPassword: string;
  website: string;
  formStartedAt: number;
};

type FieldConfig = {
  name: Exclude<keyof AccountRequestForm, "website" | "formStartedAt">;
  label: string;
  type: string;
  required?: boolean;
};

const fields = [
  {
    name: "requestedOrganizationName",
    label: "Nom de l’organisme",
    type: "text",
    required: true,
  },
  {
    name: "requestedLegalAddress",
    label: "Adresse légale",
    type: "text",
    required: true,
  },
  {
    name: "requestedEmail",
    label: "Adresse e-mail de l’organisme",
    type: "email",
  },
  { name: "requestedPhone", label: "Téléphone de l’organisme", type: "tel" },
  {
    name: "approvalNumberOrigin",
    label: "Numéro d’agrément d’origine",
    type: "text",
  },
  {
    name: "contactFullName",
    label: "Nom du contact",
    type: "text",
    required: true,
  },
  {
    name: "contactEmail",
    label: "Adresse e-mail du contact",
    type: "email",
    required: true,
  },
  {
    name: "contactPhone",
    label: "Téléphone du contact",
    type: "tel",
    required: true,
  },
  { name: "password", label: "Mot de passe", type: "password", required: true },
  {
    name: "confirmPassword",
    label: "Confirmer le mot de passe",
    type: "password",
    required: true,
  },
] satisfies FieldConfig[];

const createInitialForm = (): AccountRequestForm => ({
  requestedOrganizationName: "",
  requestedLegalAddress: "",
  requestedEmail: "",
  requestedPhone: "",
  approvalNumberOrigin: "",
  contactFullName: "",
  contactEmail: "",
  contactPhone: "",
  password: "",
  confirmPassword: "",
  website: "",
  formStartedAt: Date.now(),
});

const statusLabels: Record<string, string> = {
  submitted: "Soumise",
};

const isEmailLike = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const optional = (value: string) => {
  const next = value.trim();
  return next ? next : undefined;
};

function toPayload(form: AccountRequestForm): SubmitAccountRequestPayload {
  return {
    requestedOrganizationName: form.requestedOrganizationName.trim(),
    requestedLegalAddress: optional(form.requestedLegalAddress),
    requestedEmail: optional(form.requestedEmail)?.toLowerCase(),
    requestedPhone: optional(form.requestedPhone),
    approvalNumberOrigin: optional(form.approvalNumberOrigin),
    contactFullName: form.contactFullName.trim(),
    contactEmail: form.contactEmail.trim().toLowerCase(),
    contactPhone: optional(form.contactPhone),
    password: form.password,
    website: optional(form.website),
    formStartedAt: form.formStartedAt,
  };
}

const requiredMessage = (label: string) => `${label} est requis.`;

export function AccountRequestPage(): React.JSX.Element {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AccountRequestForm>({
    defaultValues: createInitialForm(),
    mode: "onBlur",
  });
  const password = watch("password");

  const getFieldRules = (
    field: FieldConfig,
  ): RegisterOptions<AccountRequestForm, FieldConfig["name"]> => {
    const rules: RegisterOptions<AccountRequestForm, FieldConfig["name"]> = {};

    if (field.required) {
      rules.required = requiredMessage(field.label);
    }

    if (field.name === "requestedEmail" || field.name === "contactEmail") {
      rules.validate = (value) =>
        !value || isEmailLike(String(value))
          ? true
          : `${field.label} n’est pas valide.`;
    }

    if (field.name === "password") {
      rules.minLength = {
        value: 8,
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      };
    }

    if (field.name === "confirmPassword") {
      rules.validate = (value) =>
        value === password
          ? true
          : "La confirmation du mot de passe ne correspond pas.";
    }

    return rules;
  };

  const onSubmit: SubmitHandler<AccountRequestForm> = async (form) => {
    setError("");

    try {
      const response = await submitAccountRequest(toPayload(form));
      reset(createInitialForm());
      const status = response.request?.status ?? "submitted";
      toast.success("Votre demande de compte a été envoyée.", {
        description: `Statut : ${
          statusLabels[status] ?? status
        }. Elle sera examinée par un agent habilité avant activation.`,
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof PortalApiError
          ? caughtError.message
          : "Impossible d’envoyer la demande pour le moment. Veuillez réessayer.";

      setError(message);
      toast.error("Envoi impossible", {
        description: message,
      });
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="page-title">Demande de compte postulant</h1>
        <p className="page-subtitle">
          Renseignez les informations de votre organisme et du contact
          principal. La demande sera examinée par l’ANAC avant activation du
          compte.
        </p>
      </div>

      <form
        className="surface grid gap-5 rounded-lg p-5 sm:grid-cols-2"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
      >
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 sm:col-span-2">
            {error}
          </div>
        ) : null}

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          {...register("website")}
        />
        <input
          type="hidden"
          {...register("formStartedAt", { valueAsNumber: true })}
        />

        {fields.map((field) => {
          const fieldError = errors[field.name];
          const errorId = `${field.name}-error`;

          return (
            <Field key={field.name}>
              <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
              <Input
                id={field.name}
                type={field.type}
                required={field.required}
                disabled={isSubmitting}
                invalid={Boolean(fieldError)}
                badge={
                  field.required ? (
                    <Badge variant="destructive">Requis</Badge>
                  ) : (
                    <Badge variant="outline">Optionnel</Badge>
                  )
                }
                aria-invalid={fieldError ? "true" : "false"}
                aria-describedby={fieldError ? errorId : undefined}
                {...register(field.name, getFieldRules(field))}
              />
              <FieldError id={errorId}>{fieldError?.message}</FieldError>
            </Field>
          );
        })}

        <div className="sm:col-span-2">
          <Button
            type="submit"
            variant="default"
            className="py-5 px-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="ml-2 flex items-center gap-2">
                <Loader2 className="animate-spin size-4" />
                Envoi en cours…
              </span>
            ) : (
              <span>Envoyer la demande</span>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
