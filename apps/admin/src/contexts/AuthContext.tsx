import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_PREFIX } from '../config/app';
import { isMockMode } from '../lib/data/data-mode';
import {
  changeInternalPassword,
  getCurrentUser,
  loginBootstrap,
  loginInternal,
  logoutAdmin,
  type AuthUser,
} from '../lib/api/auth.api';

export type { AuthUser };

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  requiresPasswordChange: boolean;
  login: () => void;
  loginBootstrap: (email: string, password: string) => Promise<AuthUser>;
  loginInternal: (matricule: string, password: string) => Promise<{ user: AuthUser; requiresPasswordChange: boolean }>;
  loadCurrentUser: () => Promise<AuthUser | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = `${STORAGE_PREFIX}_token`;

const mockUser: AuthUser = {
  id: 'demo-user',
  userType: 'internal',
  fullName: 'Agent DN',
  email: 'agent@aidn.local',
  matricule: 'DEMO',
  role: 'admin',
  permissions: [
    'PERSONNEL_SEARCH',
    'AIDN_USER_ACTIVATE',
    'AUDIT_VIEW',
    'REQUEST_VIEW_ALL',
    'REQUEST_INTAKE_REVIEW',
    'COURRIER_REGISTER_PHYSICAL',
    'DG_CIRCUIT_HANDLE',
    'PRE_EVAL_DG_CIRCUIT_HANDLE',
    'PRE_EVAL_DG_RETURN_CONSULT',
    'DOSSIER_VIEW_ALL',
    'DOCUMENT_UPLOAD_INTERNAL',
    'DOCUMENT_REVIEW',
    'MEETING_MANAGE',
    'PHASE_CLOSE',
  ],
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setRequiresPasswordChange(false);
    setIsAuthenticated(false);
  }, []);

  const storeSession = useCallback((nextUser: AuthUser, mustChangePassword = false) => {
    if (nextUser.userType !== 'internal') {
      clearSession();
      throw new Error('Admin access is restricted to internal users.');
    }

    setUser({ ...nextUser, mustChangePassword });
    setRequiresPasswordChange(mustChangePassword);
    setIsAuthenticated(true);
  }, [clearSession]);

  const loadCurrentUser = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY);

    if (isMockMode()) {
      setUser(mockUser);
      setRequiresPasswordChange(false);
      setIsAuthenticated(true);
      return mockUser;
    }

    try {
      const currentUser = await getCurrentUser();
      if (currentUser.userType !== 'internal') {
        clearSession();
        await logoutAdmin().catch(() => undefined);
        return null;
      }

      setUser(currentUser);
      setRequiresPasswordChange(currentUser.mustChangePassword === true);
      setIsAuthenticated(true);
      return currentUser;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  const logout = useCallback(async () => {
    if (!isMockMode()) {
      await logoutAdmin().catch(() => undefined);
    }
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      await loadCurrentUser();
      if (mounted) {
        setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      mounted = false;
    };
  }, [loadCurrentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      requiresPasswordChange,
      login: () => {
        storeSession(mockUser, false);
      },
      loginBootstrap: async (email: string, password: string) => {
        if (isMockMode()) {
          storeSession(mockUser, false);
          return mockUser;
        }

        const response = await loginBootstrap(email, password);
        storeSession(response.user, false);
        return response.user;
      },
      loginInternal: async (matricule: string, password: string) => {
        if (isMockMode()) {
          storeSession(mockUser, false);
          return { user: mockUser, requiresPasswordChange: false };
        }

        const response = await loginInternal(matricule, password);
        const mustChangePassword = response.requiresPasswordChange === true;
        storeSession(response.user, mustChangePassword);
        return { user: response.user, requiresPasswordChange: mustChangePassword };
      },
      loadCurrentUser,
      changePassword: async (currentPassword: string, newPassword: string) => {
        if (isMockMode()) {
          setRequiresPasswordChange(false);
          setUser(mockUser);
          return mockUser;
        }

        const response = await changeInternalPassword(currentPassword, newPassword);
        setUser(response.user);
        setRequiresPasswordChange(false);
        setIsAuthenticated(true);
        return response.user;
      },
      logout,
    }),
    [isAuthenticated, isLoading, loadCurrentUser, logout, requiresPasswordChange, storeSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
