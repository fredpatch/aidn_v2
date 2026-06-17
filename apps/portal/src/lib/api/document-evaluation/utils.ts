import { portalGet, portalPostForm } from "../http";
import type {
  PortalCorrectionUploadResult,
  PortalPaymentProofUploadResult,
  PortalPhase3State,
} from "./types";

export function getPortalPhase3State(
  dossierId: string,
): Promise<PortalPhase3State> {
  return portalGet<PortalPhase3State>(
    `/api/v1/portal/dossiers/${dossierId}/phases/document-evaluation`,
  );
}

export function uploadPortalPaymentProof(
  dossierId: string,
  formData: FormData,
): Promise<PortalPaymentProofUploadResult> {
  return portalPostForm<PortalPaymentProofUploadResult>(
    `/api/v1/portal/dossiers/${dossierId}/phases/document-evaluation/payment-proof`,
    formData,
  );
}

export function uploadPortalDocumentEvaluationCorrection(
  evaluationId: string,
  formData: FormData,
): Promise<PortalCorrectionUploadResult> {
  return portalPostForm<PortalCorrectionUploadResult>(
    `/api/v1/portal/document-evaluations/${evaluationId}/correction`,
    formData,
  );
}
