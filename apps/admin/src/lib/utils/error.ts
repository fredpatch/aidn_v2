import { ApiError } from "@/lib/api/client";

export function extractError(error: unknown, fallback = "Une erreur est survenue. Réessayez."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  const msg =
    (error as any)?.response?.data?.error?.message ??
    (error as any)?.response?.data?.message;
  if (typeof msg === "string" && msg.length > 0) return msg;
  return fallback;
}
