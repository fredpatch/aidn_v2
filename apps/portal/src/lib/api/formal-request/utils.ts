import { portalGetBlob, portalPostForm } from "../http";

export function uploadFormalRequestCourrier(
  dossierId: string,
  formData: FormData,
): Promise<{
  phase: {
    id: string;
    phaseKey: "formal_request";
    status: string;
    formalRequestStatus: string;
    canSendToDg: boolean;
  };
  gate: {
    exists: boolean;
    formalRequestCourrierId?: string;
    source: "portal_upload";
    receivedAt?: string;
  };
  progress: {
    blockingMissing: boolean;
    completionRate: number | null;
  };
}> {
  return portalPostForm(
    `/api/v1/portal/dossiers/${dossierId}/phases/formal-request/courrier`,
    formData,
  );
}

export function uploadFormalRequestDocument(
  dossierId: string,
  requirementId: string,
  formData: FormData,
): Promise<{ ok: boolean }> {
  return portalPostForm(
    `/api/v1/portal/dossiers/${dossierId}/phases/formal-request/documents/${requirementId}`,
    formData,
  );
}

export function downloadFormalRequestTemplate(
  templateId: string,
): Promise<Blob> {
  return portalGetBlob(
    `/api/v1/portal/document-templates/${templateId}/download`,
  );
}
