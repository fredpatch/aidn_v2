import { portalGet, portalGetBlob, portalPostForm } from "../http";
import type { PortalDossierDetail } from "./types";

export function getPortalDossier(id: string): Promise<PortalDossierDetail> {
  return portalGet<PortalDossierDetail>(`/api/v1/portal/dossiers/${id}`);
}

export function uploadPreEvaluationForm(
  dossierId: string,
  file: File,
): Promise<{ ok: boolean }> {
  const form = new FormData();
  form.set("file", file);
  return portalPostForm(
    `/api/v1/portal/dossiers/${dossierId}/preliminary/upload-pre-evaluation-form`,
    form,
  );
}

export function downloadPortalDossierDocument(
  dossierId: string,
  documentId: string,
): Promise<Blob> {
  return portalGetBlob(
    `/api/v1/portal/dossiers/${dossierId}/documents/${documentId}`,
  );
}
