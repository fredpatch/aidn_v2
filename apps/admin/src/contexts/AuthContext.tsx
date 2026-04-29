import { createContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_PREFIX } from '../config/app';

interface AuthUser {
  name: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = `${STORAGE_PREFIX}_token`;

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem(TOKEN_KEY);
      setIsAuthenticated(Boolean(token));
      setUser(token ? { name: 'Agent DN' } : null);
      setIsLoading(false);
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      login: (token: string) => {
        localStorage.setItem(TOKEN_KEY, token);
        setUser({ name: 'Agent DN' });
        setIsAuthenticated(true);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setIsAuthenticated(false);
      },
    }),
    [isAuthenticated, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
