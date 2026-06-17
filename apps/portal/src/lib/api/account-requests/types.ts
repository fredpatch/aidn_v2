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
