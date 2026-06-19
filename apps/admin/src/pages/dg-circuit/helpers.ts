import type { DgCircuitTask } from "@/lib/api/dg-circuit";

function getDgReturnFileFieldName(
  source: DgCircuitTask["source"],
): "returnedScannedDocument" | "file" {
  return source === "initial_request" ? "returnedScannedDocument" : "file";
}

function getDgReturnDateFieldName(
  source: DgCircuitTask["source"],
): "returnedFromDgAt" | "returnedAt" {
  return source === "formal_request" ? "returnedFromDgAt" : "returnedAt";
}

export function buildDgReturnFormData({
  source,
  file,
  returnedAt,
}: {
  source: DgCircuitTask["source"];
  file: File;
  returnedAt?: string;
}): FormData {
  const form = new FormData();

  form.set(getDgReturnFileFieldName(source), file);

  if (returnedAt) {
    form.set(getDgReturnDateFieldName(source), returnedAt);
  }

  return form;
}
