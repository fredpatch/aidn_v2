import { portalGet, portalPatch, portalPost, portalPostForm } from "../http";
import type {
  CreateRequestPayload,
  ListRequestsFilters,
  PortalCourrier,
  PortalDocument,
  PortalRequest,
  SubmitRequestWithCourrierPayload,
  UpdateRequestPayload,
} from "./types";

export function createRequest(
  payload: CreateRequestPayload,
): Promise<{ request: PortalRequest }> {
  return portalPost<{ request: PortalRequest }>(
    "/api/v1/portal/requests",
    payload,
  );
}

export function listRequests(
  filters: ListRequestsFilters = {},
): Promise<{ items: PortalRequest[]; total?: number }> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return portalGet<{ items: PortalRequest[]; total?: number }>(
    `/api/v1/portal/requests${query ? `?${query}` : ""}`,
  );
}

export function getRequest(id: string): Promise<{
  request: PortalRequest;
  courrier?: PortalCourrier;
  document?: PortalDocument;
}> {
  return portalGet(`/api/v1/portal/requests/${id}`);
}

export function updateRequest(
  id: string,
  payload: UpdateRequestPayload,
): Promise<{ request: PortalRequest }> {
  return portalPatch<{ request: PortalRequest }>(
    `/api/v1/portal/requests/${id}`,
    payload,
  );
}

export function uploadRequestCourrier(
  id: string,
  payload: { file: File; notes?: string },
): Promise<{
  request: PortalRequest;
  courrier: PortalCourrier;
  document: PortalDocument;
}> {
  const form = new FormData();
  form.set("file", payload.file);
  if (payload.notes) {
    form.set("notes", payload.notes);
  }

  return portalPostForm(`/api/v1/portal/requests/${id}/courrier`, form);
}

export function declarePhysicalDeposit(
  id: string,
  payload: {
    expectedDepositDate?: string;
    physicalDepositDate?: string;
    location?: "ANAC" | "DG" | "DN" | "other";
    notes?: string;
  },
): Promise<{ request: PortalRequest; courrier: PortalCourrier }> {
  return portalPost(`/api/v1/portal/requests/${id}/physical-deposit`, payload);
}

export function submitRequest(id: string): Promise<{ request: PortalRequest }> {
  return portalPost(`/api/v1/portal/requests/${id}/submit`, {});
}

export function submitRequestWithCourrier(
  id: string,
  payload: SubmitRequestWithCourrierPayload,
): Promise<{ request: PortalRequest }> {
  const form = new FormData();
  form.set("requestType", payload.requestType);
  form.set("subject", payload.subject);
  if (payload.message) form.set("message", payload.message);
  form.set("courrierSource", payload.courrierSource);
  if (payload.file) form.set("file", payload.file);
  if (payload.plannedPhysicalDepositDate) {
    form.set("plannedPhysicalDepositDate", payload.plannedPhysicalDepositDate);
  }
  if (payload.depositLocation) {
    form.set("depositLocation", payload.depositLocation);
  }
  if (payload.notes) form.set("notes", payload.notes);

  return portalPostForm(`/api/v1/portal/requests/${id}/submit`, form);
}
