import { AxiosError } from "axios";

import { PortalApiError } from "./errors";
import { extractErrorMessage, normalizeErrorPayload } from "./formatters";

export type JsonOptions = {
  auth?: boolean;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function getCsrfHeader(
  options: JsonOptions = {},
): Record<string, string> {
  const csrfToken =
    options.auth === false ? null : getCookie("aidn_portal_csrf");

  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
}

export function toPortalApiError(error: unknown): PortalApiError {
  if (error instanceof PortalApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    return new PortalApiError(
      status,
      extractErrorMessage(normalizeErrorPayload(error.response?.data)),
    );
  }

  return new PortalApiError(0);
}
