import { apiGet, apiPost } from './client';

export type AuthUser = {
  id: string;
  userType: 'internal' | 'postulant';
  fullName: string;
  email?: string;
  matricule?: string;
  role: string;
  permissions: string[];
  mustChangePassword?: boolean;
};

type LoginResponse = {
  requiresPasswordChange?: boolean;
  user: AuthUser;
};

export function loginBootstrap(email: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/v1/auth/bootstrap/login', { email, password });
}

export function loginInternal(matricule: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/v1/auth/internal/login', { matricule, password });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiGet<AuthUser>('/api/v1/auth/me');
}

export function changeInternalPassword(currentPassword: string, newPassword: string): Promise<{ user: AuthUser }> {
  return apiPost<{ user: AuthUser }>('/api/v1/auth/internal/change-password', { currentPassword, newPassword });
}

export function logoutAdmin(): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>('/api/v1/auth/logout', {});
}
