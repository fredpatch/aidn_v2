import { portalGet, portalPatch, portalPost, portalPostForm } from "./http";

export type PortalUser = {
  id: string;
  userType: "postulant";
  fullName: string;
  email: string;
  phone?: string;
  role: "postulant";
  organizationId: string;
};

export type PortalLoginResponse = {
  user: PortalUser;
};

type PortalMeResponse = PortalUser | { user: PortalUser };

export type SubmitAccountRequestPayload = {
  requestedOrganizationName: string;
  requestedLegalAddress?: string;
  requestedEmail?: string;
  requestedPhone?: string;
  approvalNumberOrigin?: string;
  contactFullName: string;
  contactEmail: string;
  contactPhone?: string;
  password: string;
  website?: string;
  formStartedAt: number;
};

export type SubmitAccountRequestResponse = {
  request: {
    id: string;
    requestedOrganizationName: string;
    contactFullName: string;
    contactEmail: string;
    status: "submitted";
    createdAt: string;
  };
};

export function submitAccountRequest(
  payload: SubmitAccountRequestPayload,
): Promise<SubmitAccountRequestResponse> {
  return portalPost<SubmitAccountRequestResponse>(
    "/api/v1/portal/account-requests",
    payload,
    { auth: false },
  );
}

export function loginPortal(
  payload: {
    email: string;
    password: string;
  },
): Promise<{ user: PortalUser }> {
  return portalPost<PortalLoginResponse>(
    "/api/v1/portal/auth/login",
    payload,
  ).then(({ user }) => ({ user }));
}

export function getPortalMe(): Promise<{ user: PortalUser }> {
  return portalGet<PortalMeResponse>("/api/v1/portal/auth/me").then(
    (response) => ("user" in response ? response : { user: response }),
  );
}

export function logoutPortal(): Promise<{ ok: true }> {
  return portalPost<{ ok: true }>("/api/v1/portal/auth/logout", {});
}

export type PortalRequestType =
  | "oma_approval"
  | "oma_recognition"
  | "oma_renewal"
  | "oma_modification";

export type PortalRequestStatus =
  | "draft"
  | "courrier_uploaded"
  | "courrier_physical_declared"
  | "submitted"
  | "intake_in_review"
  | "intake_requires_correction"
  | "initial_sent_to_dg"
  | "initial_dg_returned"
  | "initial_dg_decision_recorded"
  | "oriented_to_dn"
  | "rejected"
  | "reoriented"
  | "dossier_opened"
  | "closed";

export type PortalRequest = {
  id: string;
  organizationId: string;
  submittedById: string;
  requestType: PortalRequestType;
  subject: string;
  message?: string;
  status: PortalRequestStatus;
  portalStatusLabel: string;
  courrierSource?: "portal_upload" | "physical_deposit";
  initialCourrierId?: string;
  initialDocumentId?: string;
  physicalDeposit?: {
    declaredAt?: string;
    declaredById?: string;
    expectedDepositDate?: string;
    physicalDepositDate?: string;
    location?: "ANAC" | "DG" | "DN" | "other";
    notes?: string;
  };
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalCourrier = {
  id: string;
  requestId: string;
  type: "initial_request_courrier";
  source: "portal_upload" | "physical_deposit";
  physicalDepositDate?: string;
  uploadedAt?: string;
  documentId?: string;
  registeredById?: string;
  notes?: string;
};

export type PortalDocument = {
  id: string;
  ownerType: "request";
  ownerId: string;
  category: "courrier";
  documentType: "initial_courrier";
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  visibility: "internal_only" | "postulant_visible";
  status: string;
  version: number;
  uploadedAt: string;
};

export function createRequest(payload: {
  requestType: PortalRequestType;
  subject: string;
  message?: string;
}): Promise<{ request: PortalRequest }> {
  return portalPost<{ request: PortalRequest }>("/api/v1/portal/requests", payload);
}

export function listRequests(filters: {
  status?: PortalRequestStatus;
  requestType?: PortalRequestType;
  search?: string;
  from?: string;
  to?: string;
} = {}): Promise<{ items: PortalRequest[]; total?: number }> {
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
  payload: {
    requestType?: PortalRequestType;
    subject?: string;
    message?: string;
  },
): Promise<{ request: PortalRequest }> {
  return portalPatch<{ request: PortalRequest }>(`/api/v1/portal/requests/${id}`, payload);
}

export function uploadRequestCourrier(
  id: string,
  payload: { file: File; notes?: string },
): Promise<{ request: PortalRequest; courrier: PortalCourrier; document: PortalDocument }> {
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
