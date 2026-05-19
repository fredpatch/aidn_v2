import { API_BASE_URL } from '../../config/app';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message = 'Erreur API') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function assertApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error("L'URL de base API n'est pas configuree. Definissez VITE_API_BASE_URL dans .env pour utiliser le mode API.");
  }
}

export function getApiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function getUnsafeApiHeaders(): Record<string, string> {
  const csrfToken = getCookie('aidn_admin_csrf');

  return {
    ...getApiHeaders(),
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(response.status, 'Reponse API illisible');
  }
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  let message = 'Connexion impossible.';
  try {
    const payload = await readJson<{
      message?: string;
      error?: string | { message?: string };
    }>(response);
    message =
      (typeof payload.error === 'string' ? payload.error : payload.error?.message) ||
      payload.message ||
      message;
  } catch {
    // Keep the generic French message when the backend response is not JSON.
  }

  throw new ApiError(response.status, message);
}

export async function apiGet<T>(path: string): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: getApiHeaders(),
  });
  await assertOk(response);
  return readJson<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: getUnsafeApiHeaders(),
    body: JSON.stringify(body),
  });
  await assertOk(response);
  return readJson<T>(response);
}

export async function apiPostForm<T>(path: string, body: FormData): Promise<T> {
  assertApiConfigured();
  const csrfToken = getCookie('aidn_admin_csrf');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
    body,
  });
  await assertOk(response);
  return readJson<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: getUnsafeApiHeaders(),
    body: JSON.stringify(body),
  });
  await assertOk(response);
  return readJson<T>(response);
}

export async function apiDelete(path: string): Promise<void> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getUnsafeApiHeaders(),
  });
  await assertOk(response);
}
