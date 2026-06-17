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
  dossierId?: string;
  physicalDeposit?: {
    declaredAt?: string;
    declaredById?: string;
    status?: "planned" | "received";
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

export type ListRequestsFilters = {
  status?: PortalRequestStatus;
  requestType?: PortalRequestType;
  search?: string;
  from?: string;
  to?: string;
};

export type CreateRequestPayload = {
  requestType: PortalRequestType;
  subject: string;
  message?: string;
};

export type UpdateRequestPayload = Partial<CreateRequestPayload>;

export type SubmitRequestWithCourrierPayload = {
  requestType: PortalRequestType;
  subject: string;
  message?: string;
  courrierSource: "portal_upload" | "physical_deposit";
  file?: File;
  plannedPhysicalDepositDate?: string;
  depositLocation?: "ANAC" | "DG" | "DN" | "other";
  notes?: string;
};
