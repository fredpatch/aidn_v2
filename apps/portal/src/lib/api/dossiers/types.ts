import type { PortalDossierFormalRequest } from "../formal-request/types";

export type PortalDossierMeeting = {
  scheduledAt: string | null;
  location: string | null;
  status: string;
  notes: string | null;
};

export type PortalDossierPreliminary = {
  status: string | null;
  portalLabel: string;
  preEvaluationFormDocumentId: string | null;
  firstMeetingReportDocumentId: string | null;
  hasCompletedForm: boolean;
  canSubmitForm: boolean;
  firstMeeting: PortalDossierMeeting | null;
  preliminaryMeeting: PortalDossierMeeting | null;
};

export type PortalDossierDetail = {
  dossier: {
    id: string;
    dossierNumber: string;
    dossierType: string;
    status: string;
    openedAt: string;
  };
  preliminary: PortalDossierPreliminary;
  formalRequest?: PortalDossierFormalRequest;
};
