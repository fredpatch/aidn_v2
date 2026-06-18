import { ApiError } from "@/lib/api/client";

export function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return "Session expiree. Veuillez vous reconnecter.";
    }
    return err.message;
  }
  return "Une erreur est survenue.";
}
