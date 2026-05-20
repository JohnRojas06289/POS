'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncApi } from '../lib/api';
import { v4 as uuidv4 } from 'uuid';

interface PendingOrder {
  localId: string;
  payload: unknown;
  createdAt: string;
  status: 'pending' | 'synced' | 'error';
}

interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingOrders: PendingOrder[];
  addPendingOrder: (order: unknown) => string;
  syncPending: () => Promise<void>;
  setOnline: (online: boolean) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingCount: 0,
      isSyncing: false,
      lastSyncAt: null,
      pendingOrders: [],

      addPendingOrder: (order) => {
        const localId = uuidv4();
        set((s) => ({
          pendingOrders: [
            ...s.pendingOrders,
            { localId, payload: order, createdAt: new Date().toISOString(), status: 'pending' },
          ],
          pendingCount: s.pendingCount + 1,
        }));
        return localId;
      },

      syncPending: async () => {
        const { pendingOrders, isSyncing } = get();
        const pending = pendingOrders.filter((o) => o.status === 'pending');
        if (isSyncing || pending.length === 0) return;

        set({ isSyncing: true });
        try {
          const operations = pending.map((o) => ({
            localId: o.localId,
            entityType: 'order' as const,
            operation: 'CREATE' as const,
            payload: o.payload as Record<string, unknown>,
            clientTimestamp: o.createdAt,
          }));

          const result = await syncApi.push({
            terminalId: typeof window !== 'undefined'
              ? localStorage.getItem('nexus_terminal_id') ?? 'web-terminal'
              : 'web-terminal',
            operations,
          }) as { results: Array<{ localId: string; status: string }> };

          const succeededIds = result.results
            .filter((r) => r.status === 'done' || r.status === 'skipped')
            .map((r) => r.localId);

          set((s) => ({
            pendingOrders: s.pendingOrders.map((o) =>
              succeededIds.includes(o.localId) ? { ...o, status: 'synced' as const } : o,
            ),
            pendingCount: s.pendingOrders.filter(
              (o) => o.status === 'pending' && !succeededIds.includes(o.localId),
            ).length,
            lastSyncAt: new Date(),
          }));
        } finally {
          set({ isSyncing: false });
        }
      },

      setOnline: (online) => set({ isOnline: online }),
    }),
    {
      name: 'nexus-offline',
      partialize: (s) => ({ pendingOrders: s.pendingOrders, pendingCount: s.pendingCount }),
    },
  ),
);
