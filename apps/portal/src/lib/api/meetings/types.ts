export type PortalMeetingStatus =
  | "planned"
  | "invited"
  | "held"
  | "postponed"
  | "cancelled";

export type PortalMeeting = {
  id: string;
  dossierId: string;
  dossierNumber: string;
  dossierType: string;
  meetingType: string;
  title: string;
  scheduledAt?: string;
  location?: string;
  status: PortalMeetingStatus;
  notes?: string;
  phaseKey?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListPortalMeetingsParams = {
  from?: string;
  to?: string;
  status?: PortalMeetingStatus | "all";
};
