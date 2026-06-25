import type { PortalDossierMeeting } from "../dossiers/types";

export type PortalFormalRequestSubmission = {
  submissionId: string;
  uploadedAt: string;
  status: string;
  reviewComment?: string;
};

export type PortalFormalRequestTemplate = {
  templateId: string;
  title: string;
  fileName: string;
};

export type PortalFormalRequestRequirement = {
  requirementId: string;
  code: string;
  label: string;
  formCode?: string;
  requirementLevel: "gate" | "expected" | "optional" | "conditional";
  isRepeatable: boolean;
  template?: PortalFormalRequestTemplate;
  status:
    | "missing"
    | "submitted"
    | "under_review"
    | "validated"
    | "requires_correction"
    | "incomplete"
    | "rejected";
  submissions: PortalFormalRequestSubmission[];
};

export type PortalFormalRequestProgress = {
  totalTracked: number;
  submitted: number;
  validated: number;
  missing: number;
};

export type PortalDossierFormalRequest = {
  status: string | null;
  portalLabel: string;
  hasFormalRequestCourrier: boolean;
  canUploadFormalRequestCourrier: boolean;
  requirements: PortalFormalRequestRequirement[];
  progress: PortalFormalRequestProgress;
  formalMeeting: PortalDossierMeeting | null;
};
