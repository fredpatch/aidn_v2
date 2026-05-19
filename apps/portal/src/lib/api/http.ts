export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const PORTAL_TOKEN_KEY = "aidn_portal_token";

export class PortalApiError extends Error {
  status: number;

  constructor(status: number, message = "Connexion impossible.") {
    super(message);
    this.name = "PortalApiError";
    this.status = status;
  }
}

type ApiErrorPayload = {
  message?: string;
  error?: string | { message?: string };
};

function extractErrorMessage(payload: ApiErrorPayload | undefined): string {
  if (!payload) {
    return "Connexion impossible.";
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return payload.error?.message ?? payload.message ?? "Connexion impossible.";
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function getJsonHeaders(options: { auth?: boolean } = {}): Record<string, string> {
  const csrfToken =
    options.auth === false ? null : getCookie("aidn_portal_csrf");

  return {
    "Content-Type": "application/json",
    ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
  };
}

export async function portalPost<TResponse>(
  path: string,
  body: unknown,
  options: { auth?: boolean } = {},
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: getJsonHeaders(options),
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown;

  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    throw new PortalApiError(response.status, "Reponse API illisible.");
  }

  if (!response.ok) {
    throw new PortalApiError(
      response.status,
      extractErrorMessage(payload as ApiErrorPayload | undefined),
    );
  }

  return payload as TResponse;
}

export async function portalPatch<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: getJsonHeaders(),
    body: JSON.stringify(body),
  });

  return parsePortalResponse<TResponse>(response);
}

export async function portalPostForm<TResponse>(
  path: string,
  body: FormData,
): Promise<TResponse> {
  const csrfToken = getCookie("aidn_portal_csrf");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
    body,
  });

  return parsePortalResponse<TResponse>(response);
}

export async function portalGet<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parsePortalResponse<TResponse>(response);
}

async function parsePortalResponse<TResponse>(
  response: Response,
): Promise<TResponse> {
  const text = await response.text();
  let payload: unknown;

  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    throw new PortalApiError(response.status, "Reponse API illisible.");
  }

  if (!response.ok) {
    throw new PortalApiError(
      response.status,
      extractErrorMessage(payload as ApiErrorPayload | undefined),
    );
  }

  return payload as TResponse;
}
