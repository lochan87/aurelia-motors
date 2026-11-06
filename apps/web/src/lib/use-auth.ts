import { createContext, useContext } from 'react';
import type { LoginInput, StaffRole, StaffUserSummary } from '@aurelia/shared';

export interface AuthContextValue {
  user: StaffUserSummary | null;
  role: StaffRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<StaffUserSummary>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
