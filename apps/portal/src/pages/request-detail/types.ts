import type { PortalCourrier, PortalDocument } from "../../lib/api/requests";
import type { PortalRequest } from "../../lib/api/requests";

export type RequestDetailTab =
  | "resume"
  | "courrier"
  | "actions"
  | "dossier"
  | "historique";

export type CourrierMode = "portal_upload" | "physical_deposit";

export type ProcessStep = {
  id: string;
  label: string;
  subtitle?: string;
  state: "done" | "active" | "locked";
};

export type RequestDetail = {
  request: PortalRequest;
  courrier?: PortalCourrier;
  document?: PortalDocument;
};
