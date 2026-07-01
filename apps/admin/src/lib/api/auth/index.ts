import { apiGet, apiPost } from '../client';
import type { AuthUser, LoginResponse } from './types';

export type { AuthUser, LoginResponse } from './types';

export function loginBootstrap(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/v1/auth/bootstrap/login', { email, password });
}

export function loginInternal(matricule: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/v1/auth/internal/login', { matricule, password });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiGet<AuthUser>('/api/v1/auth/me');
}

export function changeInternalPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ user: AuthUser }> {
  return apiPost<{ user: AuthUser }>('/api/v1/auth/internal/change-password', {
    currentPassword,
    newPassword,
  });
}

export function logoutAdmin(): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>('/api/v1/auth/logout', {});
}
