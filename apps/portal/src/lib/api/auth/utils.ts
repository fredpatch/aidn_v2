import { portalGet, portalPost } from "../http";
import type { PortalLoginResponse, PortalMeResponse, PortalUser } from "./types";

export function loginPortal(payload: {
  email: string;
  password: string;
}): Promise<{ user: PortalUser }> {
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
