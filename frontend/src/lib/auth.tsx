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
  ApiError,
  clearTokens,
  getMe,
  getRefreshToken,
  login as apiLogin,
  refreshTokens,
  setAuthFailureHandler,
  setTokens,
} from "./api";
import type { Me } from "./types";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: Me | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: Me) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    setAuthFailureHandler(logout);

    let cancelled = false;
    (async () => {
      if (!getRefreshToken()) {
        setStatus("anonymous");
        return;
      }
      const ok = await refreshTokens();
      if (cancelled) return;
      if (!ok) {
        clearTokens();
        setStatus("anonymous");
        return;
      }
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        clearTokens();
        setStatus("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const pair = await apiLogin(email, password);
    setTokens(pair);
    const me = await getMe();
    setUser(me);
    setStatus("authenticated");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, setUser }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { ApiError };
