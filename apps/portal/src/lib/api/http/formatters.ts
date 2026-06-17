import { PortalApiError } from "./errors";

export type ApiErrorPayload = {
  message?: string;
  error?: string | { message?: string };
};

export function extractErrorMessage(
  payload: ApiErrorPayload | undefined,
): string {
  if (!payload) {
    return "Connexion impossible.";
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return payload.error?.message ?? payload.message ?? "Connexion impossible.";
}

export function normalizeJsonResponse<TResponse>(data: unknown): TResponse {
  if (typeof data !== "string") {
    return data as TResponse;
  }

  try {
    return (data ? JSON.parse(data) : undefined) as TResponse;
  } catch {
    throw new PortalApiError(500, "Reponse API illisible.");
  }
}

export function normalizeErrorPayload(
  data: unknown,
): ApiErrorPayload | undefined {
  if (!data) {
    return undefined;
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data) as ApiErrorPayload;
    } catch {
      return { message: data };
    }
  }

  return data as ApiErrorPayload;
}
