import { create } from 'zustand';
import { api } from '../services/api';

export interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  role: 'candidate' | 'recruiter' | 'admin' | 'superadmin' | 'manager' | 'auditor' | string;
  avatar_url?: string;
  cover_image?: string;
  bio?: string;
  headline?: string;
  location?: string;
  company_name?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
  is_verified?: boolean;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

const getInitialUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user_info');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser && !!localStorage.getItem('access_token'),
  isLoading: false,
  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      api.post('/auth/logout/', { refresh: refreshToken }).catch((err) => {
        console.warn('Blacklist refresh token on logout failed:', err);
      });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setUser: (user) => {
    localStorage.setItem('user_info', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));
