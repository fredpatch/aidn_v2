import type { RegisterOptions } from "react-hook-form";

import { PortalApiError } from "../../lib/api/http";

export type LoginFormValues = {
  email: string;
  password: string;
};

export const loginDefaultValues: LoginFormValues = {
  email: "",
  password: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginValidationRules = {
  email: {
    required: "L'adresse e-mail est requise.",
    pattern: {
      value: emailPattern,
      message: "L'adresse e-mail n'est pas valide.",
    },
  },
  password: {
    required: "Le mot de passe est requis.",
  },
} satisfies Record<keyof LoginFormValues, RegisterOptions<LoginFormValues>>;

export function normalizeLoginValues(values: LoginFormValues): LoginFormValues {
  return {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  };
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof PortalApiError && error.status >= 500) {
    return error.message;
  }

  return "Adresse e-mail ou mot de passe incorrect.";
}
