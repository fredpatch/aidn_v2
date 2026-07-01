import { portalGet, portalPostForm } from "../http";
import type {
  PortalInspectionPaymentProofUploadResult,
  PortalInspectionState,
} from "./types";

export function getPortalInspectionState(
  dossierId: string,
): Promise<PortalInspectionState> {
  return portalGet<PortalInspectionState>(
    `/api/v1/portal/dossiers/${dossierId}/phases/inspection/payment`,
  );
}

export function uploadPortalInspectionPaymentProof(
  dossierId: string,
  formData: FormData,
): Promise<PortalInspectionPaymentProofUploadResult> {
  return portalPostForm<PortalInspectionPaymentProofUploadResult>(
    `/api/v1/portal/dossiers/${dossierId}/phases/inspection/payment-proof`,
    formData,
  );
}
