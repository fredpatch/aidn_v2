import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

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

function normalizeJsonResponse<T>(data: unknown): T {
  if (typeof data !== 'string') {
    return data as T;
  }

  try {
    return (data ? JSON.parse(data) : undefined) as T;
  } catch {
    throw new ApiError(500, 'Reponse API illisible');
  }
}

function normalizeErrorPayload(data: unknown):
  | {
      message?: string;
      error?: string | { message?: string };
    }
  | undefined {
  if (!data) {
    return undefined;
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as {
        message?: string;
        error?: string | { message?: string };
      };
    } catch {
      return { message: data };
    }
  }

  return data as {
    message?: string;
    error?: string | { message?: string };
  };
}

function extractErrorMessage(
  payload:
    | {
        message?: string;
        error?: string | { message?: string };
      }
    | undefined,
): string {
  if (!payload) {
    return 'Connexion impossible.';
  }

  if (typeof payload.error === 'string') {
    return payload.error;
  }

  return payload.error?.message ?? payload.message ?? 'Connexion impossible.';
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    return new ApiError(
      error.response?.status ?? 0,
      extractErrorMessage(normalizeErrorPayload(error.response?.data)),
    );
  }

  return new ApiError(0);
}

export const adminClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

async function requestJson<T>(config: AxiosRequestConfig): Promise<T> {
  assertApiConfigured();

  try {
    const response = await adminClient.request<T>(config);
    return normalizeJsonResponse<T>(response.data);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  return requestJson<T>({
    method: 'GET',
    url: path,
    headers: getApiHeaders(),
  });
}

export async function apiGetBlob(path: string): Promise<{ blob: Blob; fileName: string }> {
  assertApiConfigured();

  try {
    const response = await adminClient.get<Blob>(path, {
      headers: getApiHeaders(),
      responseType: 'blob',
    });

    const disposition = String(response.headers['content-disposition'] ?? '');
    const encodedFileName = disposition.match(/filename="([^"]+)"/)?.[1];
    const fileName = encodedFileName ? decodeURIComponent(encodedFileName) : 'document';

    return { blob: response.data, fileName };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>({
    method: 'POST',
    url: path,
    headers: getUnsafeApiHeaders(),
    data: body,
  });
}

export async function apiPostForm<T>(path: string, body: FormData): Promise<T> {
  const csrfToken = getCookie('aidn_admin_csrf');

  return requestJson<T>({
    method: 'POST',
    url: path,
    headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined,
    data: body,
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>({
    method: 'PATCH',
    url: path,
    headers: getUnsafeApiHeaders(),
    data: body,
  });
}

export async function apiDelete(path: string): Promise<void> {
  return requestJson<void>({
    method: 'DELETE',
    url: path,
    headers: getUnsafeApiHeaders(),
  });
}
