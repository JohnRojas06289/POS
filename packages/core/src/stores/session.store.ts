import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  schemaName: string | null;
  branchId: string | null;
  role: string | null;
  setSession: (data: {
    accessToken: string;
    refreshToken: string;
    tenantId: string;
    schemaName: string;
    branchId: string | null;
    role: string;
  }) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      schemaName: null,
      branchId: null,
      role: null,

      setSession: (data) => set(data),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          tenantId: null,
          schemaName: null,
          branchId: null,
          role: null,
        }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'nexus-session' },
  ),
);
