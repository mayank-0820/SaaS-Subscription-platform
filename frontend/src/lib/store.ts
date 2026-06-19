import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  isLoading: false,

  isAuthenticated: () => !!get().token,
  isAdmin: () => ['ADMIN', 'SUPER_ADMIN'].includes(get().user?.role || ''),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password });
      const { user, token } = response.data;
      localStorage.setItem('auth_token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register({ name, email, password });
      const { user, token } = response.data;
      localStorage.setItem('auth_token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null });
    window.location.href = '/auth/login';
  },

  fetchMe: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const response = await authApi.getMe();
      set({ user: response.data });
    } catch {
      get().logout();
    }
  },
}));

export default useAuthStore;
