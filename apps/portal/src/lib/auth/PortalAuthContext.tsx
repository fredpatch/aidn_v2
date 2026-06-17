import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getPortalMe,
  loginPortal,
  logoutPortal,
  type PortalUser,
} from "../api/auth";
import { PORTAL_TOKEN_KEY } from "../api/http";

type PortalAuthContextValue = {
  user: PortalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(
  undefined,
);

export function PortalAuthProvider({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(PORTAL_TOKEN_KEY);
    setUser(null);
  }, []);

  const storeSession = useCallback(
    async (nextUser: PortalUser) => {
      if (nextUser.userType !== "postulant") {
        clearSession();
        await logoutPortal().catch(() => undefined);
        throw new Error("Portal access is restricted to postulants.");
      }

      setUser(nextUser);
    },
    [clearSession],
  );

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginPortal({ email, password });
    await storeSession(response.user);
  }, [storeSession]);

  const logout = useCallback(async () => {
    await logoutPortal().catch(() => undefined);
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      localStorage.removeItem(PORTAL_TOKEN_KEY);

      try {
        const { user: currentUser } = await getPortalMe();
        if (currentUser.userType !== "postulant") {
          await logoutPortal().catch(() => undefined);
          throw new Error("Portal access is restricted to postulants.");
        }

        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        if (mounted) {
          clearSession();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, [clearSession]);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, user],
  );

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth(): PortalAuthContextValue {
  const value = useContext(PortalAuthContext);

  if (!value) {
    throw new Error("usePortalAuth must be used within PortalAuthProvider");
  }

  return value;
}
