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

export type PortalMeResponse = PortalUser | { user: PortalUser };
