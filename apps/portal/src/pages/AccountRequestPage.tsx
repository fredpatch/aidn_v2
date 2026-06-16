import { useState } from "react";

import {
  submitAccountRequest,
  type SubmitAccountRequestPayload,
} from "../lib/api/portal.api";
import { PortalApiError } from "../lib/api/http";
import { PortalStatusBadge } from "../components/PortalStatusBadge";

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
  { name: "requestedOrganizationName", label: "Nom de l'organisme", type: "text", required: true },
  { name: "requestedLegalAddress", label: "Adresse legale", type: "text" },
  { name: "requestedEmail", label: "Email de l'organisme", type: "email" },
  { name: "requestedPhone", label: "Telephone de l'organisme", type: "tel" },
  { name: "approvalNumberOrigin", label: "N d'agrement d'origine", type: "text" },
  { name: "contactFullName", label: "Nom du contact", type: "text", required: true },
  { name: "contactEmail", label: "Email du contact", type: "email", required: true },
  { name: "contactPhone", label: "Telephone du contact", type: "tel" },
  { name: "password", label: "Mot de passe", type: "password", required: true },
  { name: "confirmPassword", label: "Confirmer le mot de passe", type: "password", required: true },
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

function validateForm(form: AccountRequestForm): string | null {
  if (!form.requestedOrganizationName.trim()) {
    return "Le nom de l'organisme est requis.";
  }

  if (!form.contactFullName.trim()) {
    return "Le nom du contact est requis.";
  }

  if (!form.contactEmail.trim()) {
    return "L'email du contact est requis.";
  }

  if (!isEmailLike(form.contactEmail.trim())) {
    return "L'email du contact n'est pas valide.";
  }

  if (form.requestedEmail.trim() && !isEmailLike(form.requestedEmail.trim())) {
    return "L'email de l'organisme n'est pas valide.";
  }

  if (form.password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caracteres.";
  }

  if (form.confirmPassword !== form.password) {
    return "La confirmation du mot de passe ne correspond pas.";
  }

  return null;
}

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

export function AccountRequestPage(): React.JSX.Element {
  const [form, setForm] = useState<AccountRequestForm>(() => createInitialForm());
  const [error, setError] = useState("");
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmitted = Boolean(successStatus);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="page-title">Demande de compte postulant</h1>
        <p className="page-subtitle">
          Renseignez les informations de votre organisme et du contact principal.
          La demande sera examinee par l'ANAC avant activation du compte.
        </p>
      </div>

      <form
        className="surface grid gap-5 rounded-lg p-5 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setSuccessStatus(null);

          const validationError = validateForm(form);
          if (validationError) {
            setError(validationError);
            return;
          }

          setIsSubmitting(true);
          try {
            const response = await submitAccountRequest(toPayload(form));
            setForm(createInitialForm());
            setSuccessStatus(response.request?.status ?? "submitted");
          } catch (caughtError) {
            setError(
              caughtError instanceof PortalApiError
                ? caughtError.message
                : "Impossible d'envoyer la demande pour le moment. Veuillez reessayer.",
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 sm:col-span-2">
            {error}
          </div>
        ) : null}

        {isSubmitted ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 sm:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-bold">Votre demande de compte a ete envoyee.</p>
              <PortalStatusBadge
                label={`Statut : ${statusLabels[successStatus ?? "submitted"] ?? successStatus}`}
                tone="success"
              />
            </div>
            <p className="mt-2">
              Elle sera examinee par un agent habilite avant activation.
            </p>
          </div>
        ) : null}

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          value={form.website}
          onChange={(event) => {
            setForm((current) => ({
              ...current,
              website: event.target.value,
            }));
          }}
        />

        {fields.map((field) => (
          <div key={field.name} className="field">
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              required={field.required}
              value={form[field.name] ?? ""}
              disabled={isSubmitting || isSubmitted}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  [field.name]: event.target.value,
                }));
              }}
              className="control"
            />
          </div>
        ))}

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isSubmitted}
          >
            {isSubmitting ? "Envoi en cours..." : "Soumettre la demande"}
          </button>
        </div>
      </form>
    </section>
  );
}
