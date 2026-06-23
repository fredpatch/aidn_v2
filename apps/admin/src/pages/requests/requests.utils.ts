import type { AdminDocument } from "../../lib/api/requests";

// Convert optional string value to undefined if empty
export function optional(value: string): string | undefined {
  const next = value.trim();
  return next ? next : undefined;
}

// Format a document summary with file name and size in KB
export function documentSummary(document?: AdminDocument): string {
  if (!document) return "-";
  return `${document.fileName} (${Math.ceil(document.fileSize / 1024)} Ko)`;
}

// Format a date string for display in French locale
export function formatDate(value?: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
    new Date(value),
  );
}
