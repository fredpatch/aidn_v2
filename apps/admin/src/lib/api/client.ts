import { API_BASE_URL, STORAGE_PREFIX } from '../../config/app';

function assertApiConfigured(): void {
  if (!API_BASE_URL) {
    throw new Error('L’URL de base API n’est pas configurée. Définissez VITE_API_BASE_URL dans .env pour utiliser le mode API.');
  }
}

export function getApiHeaders(): Record<string, string> {
  const token = localStorage.getItem(`${STORAGE_PREFIX}_token`);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: getApiHeaders() });
  if (!response.ok) throw new Error(`Erreur API : ${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Erreur API : ${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Erreur API : ${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  assertApiConfigured();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getApiHeaders(),
  });
  if (!response.ok) throw new Error(`Erreur API : ${response.status} ${response.statusText}`);
}
