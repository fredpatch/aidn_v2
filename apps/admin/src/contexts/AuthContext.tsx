import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_PREFIX } from '../config/app';
import { isMockMode } from '../lib/data/data-mode';
import {
  changeInternalPassword,
  getCurrentUser,
  loginBootstrap,
  loginInternal,
  type AuthUser,
} from '../lib/api/auth.api';

export type { AuthUser };

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  requiresPasswordChange: boolean;
  login: (token: string) => void;
  loginBootstrap: (email: string, password: string) => Promise<AuthUser>;
  loginInternal: (matricule: string, password: string) => Promise<{ user: AuthUser; requiresPasswordChange: boolean }>;
  loadCurrentUser: () => Promise<AuthUser | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>;
  logout: () => void;
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
  permissions: ['PERSONNEL_SEARCH', 'AIDN_USER_ACTIVATE', 'AUDIT_VIEW'],
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

  const storeSession = useCallback((token: string, nextUser: AuthUser, mustChangePassword = false) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser({ ...nextUser, mustChangePassword });
    setRequiresPasswordChange(mustChangePassword);
    setIsAuthenticated(true);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clearSession();
      return null;
    }

    if (isMockMode()) {
      setUser(mockUser);
      setRequiresPasswordChange(false);
      setIsAuthenticated(true);
      return mockUser;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setRequiresPasswordChange(currentUser.mustChangePassword === true);
      setIsAuthenticated(true);
      return currentUser;
    } catch {
      clearSession();
      return null;
    }
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
      login: (token: string) => {
        storeSession(token, mockUser, false);
      },
      loginBootstrap: async (email: string, password: string) => {
        if (isMockMode()) {
          storeSession('aidn-demo-token', mockUser, false);
          return mockUser;
        }

        const response = await loginBootstrap(email, password);
        storeSession(response.token, response.user, false);
        return response.user;
      },
      loginInternal: async (matricule: string, password: string) => {
        if (isMockMode()) {
          storeSession('aidn-demo-token', mockUser, false);
          return { user: mockUser, requiresPasswordChange: false };
        }

        const response = await loginInternal(matricule, password);
        const mustChangePassword = response.requiresPasswordChange === true;
        storeSession(response.token, response.user, mustChangePassword);
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
      logout: clearSession,
    }),
    [clearSession, isAuthenticated, isLoading, loadCurrentUser, requiresPasswordChange, storeSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
