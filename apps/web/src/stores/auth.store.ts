'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

interface UserInfo {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface TenantInfo {
  id: string;
  name: string;
  schemaName: string;
}

interface BranchInfo {
  id: string;
  name: string;
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenant: TenantInfo | null;
  branch: BranchInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, tenantEmail: string) => Promise<void>;
  loginPin: (pin: string, tenantId: string, branchId: string) => Promise<void>;
  logout: () => void;
  setTokens: (access: string, refresh: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenant: null,
      branch: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password, tenantEmail) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<{ accessToken: string; refreshToken: string }>(
            '/auth/login',
            { email, password, tenantEmail },
          );
          const { accessToken, refreshToken } = res.data;
          localStorage.setItem('nexus_access_token', accessToken);
          localStorage.setItem('nexus_refresh_token', refreshToken);
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Error al iniciar sesión';
          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      loginPin: async (pin, tenantId, branchId) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<{ accessToken: string; refreshToken: string }>(
            '/auth/login-pin',
            { pin, tenantId, branchId },
          );
          const { accessToken, refreshToken } = res.data;
          localStorage.setItem('nexus_access_token', accessToken);
          localStorage.setItem('nexus_refresh_token', refreshToken);
          set({ accessToken, refreshToken, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'PIN inválido';
          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('nexus_access_token');
        localStorage.removeItem('nexus_refresh_token');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          tenant: null,
          branch: null,
          isAuthenticated: false,
        });
      },

      setTokens: (access, refresh) => {
        localStorage.setItem('nexus_access_token', access);
        localStorage.setItem('nexus_refresh_token', refresh);
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nexus-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        tenant: s.tenant,
        branch: s.branch,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
