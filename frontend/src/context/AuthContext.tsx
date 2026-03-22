import { createContext, useContext } from 'react';
import type { AuthResponse, User } from '../lib/api.models';

interface AuthContextValue {
  currentUser: User | null;
  onAuthSuccess: (session: AuthResponse, mode: 'login' | 'register') => void;
  onLogout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  onAuthSuccess: () => {},
  onLogout: () => {}
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
