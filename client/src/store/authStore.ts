import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token, refreshToken) => {
    localStorage.setItem('canlua_access_token', token);
    localStorage.setItem('canlua_user', JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem('canlua_refresh_token', refreshToken);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('canlua_access_token');
    localStorage.removeItem('canlua_refresh_token');
    localStorage.removeItem('canlua_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  initAuth: () => {
    const token = localStorage.getItem('canlua_access_token');
    const userStr = localStorage.getItem('canlua_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('canlua_access_token');
        localStorage.removeItem('canlua_user');
      }
    }
  },
}));
