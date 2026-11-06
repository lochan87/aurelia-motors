import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { LoginInput, StaffUserSummary } from '@aurelia/shared';

import { api, setCsrfToken } from './api-client';
import { AuthContext, type AuthContextValue } from './use-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    api
      .getMe()
      .then((data) => {
        if (!isMounted) return;
        setUser(data.user);
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
        setCsrfToken(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
      }
    } catch {
      setUser(null);
      setCsrfToken(null);
    }
  }, []);

  const login = useCallback(async (credentials: LoginInput): Promise<StaffUserSummary> => {
    const response = await api.login(credentials);
    setUser(response.user);
    if (response.csrfToken) {
      setCsrfToken(response.csrfToken);
    }
    return response.user;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setCsrfToken(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user && user.isActive),
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
