'use client';

import { create } from 'zustand';
import { cashApi } from '../lib/api';

interface CashSession {
  id: string;
  terminalId: string;
  branchId: string;
  cashierId: string;
  status: string;
  openingAmount: number;
  openedAt: string;
}

interface CashSessionSummary {
  session: CashSession;
  totalSales: number;
  totalRefunds: number;
  byMethod: Record<string, number>;
  difference: number | null;
}

interface SessionState {
  currentSession: CashSession | null;
  isOpen: boolean;
  isLoading: boolean;
  openSession: (terminalId: string, openingCash: number) => Promise<void>;
  closeSession: (closingCash: number) => Promise<CashSessionSummary>;
  setSession: (session: CashSession | null) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  currentSession: null,
  isOpen: false,
  isLoading: false,

  openSession: async (terminalId, openingCash) => {
    set({ isLoading: true });
    try {
      const session = await cashApi.openSession({ terminalId, openingCash }) as CashSession;
      set({ currentSession: session, isOpen: true, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  closeSession: async (closingCash) => {
    const { currentSession } = get();
    if (!currentSession) throw new Error('No hay sesión activa');
    set({ isLoading: true });
    try {
      const summary = await cashApi.closeSession(currentSession.id, { closingCash }) as CashSessionSummary;
      set({ currentSession: null, isOpen: false });
      return summary;
    } finally {
      set({ isLoading: false });
    }
  },

  setSession: (session) => set({ currentSession: session, isOpen: !!session }),
}));
