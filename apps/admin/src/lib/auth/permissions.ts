import type { AuthUser } from '../../contexts/AuthContext';

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  return Boolean(user?.permissions.includes(permission));
}

export function hasAnyPermission(user: AuthUser | null, permissions: string[]): boolean {
  return permissions.length === 0 || permissions.some((permission) => hasPermission(user, permission));
}
