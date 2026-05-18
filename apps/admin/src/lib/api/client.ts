import { API_BASE_URL, STORAGE_PREFIX } from '../../config/app';

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
  const token = localStorage.getItem(`${STORAGE_PREFIX}_token`);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    const payload = await readJson<{ message?: string; error?: string }>(response);
    message = payload.message || payload.error || message;
  } catch {
    // Keep the generic French message when the backend response is not JSON.
  }

  throw new ApiError(response.status, message);
}

export async function apiGet<T>(path: string): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: getApiHeaders() });
  await assertOk(response);
  return readJson<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  await assertOk(response);
  return readJson<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  await assertOk(response);
  return readJson<T>(response);
}

export async function apiDelete(path: string): Promise<void> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getApiHeaders(),
  });
  await assertOk(response);
}
