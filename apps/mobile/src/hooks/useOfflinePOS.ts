import { useState, useCallback, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import {
  getPendingSync,
  getSyncMeta,
  markSynced,
  saveReceipt,
  saveOfflineOrder,
  setSyncMeta,
} from '../database/local.db';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface OrderPayload {
  localId: string;
  items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
  payments: Array<{ method: string; amount: number }>;
  branchId?: string;
}

export function useOfflinePOS() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const refreshSyncMeta = useCallback(async () => {
    const [pending, lastSync] = await Promise.all([
      getPendingSync(),
      getSyncMeta('lastSyncAt'),
    ]);
    setPendingCount(pending.length);
    setLastSyncAt(lastSync);
  }, []);

  useEffect(() => {
    void refreshSyncMeta();
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
      if (online) void syncPending();
    });
    return () => unsub();
  }, [refreshSyncMeta]);

  const syncPending = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const pending = await getPendingSync();
      setPendingCount(pending.length);
      if (pending.length === 0) return;

      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      const terminalId = (await SecureStore.getItemAsync('terminal_id')) ?? 'mobile-terminal';

      const res = await fetch(`${API_URL}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          terminalId,
          operations: pending.map((o) => ({
            localId: o.localId,
            entityType: 'order',
            operation: 'CREATE',
            payload: o.payload,
            clientTimestamp: o.createdAt,
          })),
        }),
      });

      if (!res.ok) return;
      const data = (await res.json()) as { results: Array<{ localId: string; status: string }> };
      const succeeded = data.results
        .filter((r) => r.status === 'done' || r.status === 'skipped')
        .map((r) => r.localId);
      await markSynced(succeeded);
      const syncedAt = new Date().toISOString();
      await setSyncMeta('lastSyncAt', syncedAt);
      setLastSyncAt(syncedAt);
      const remaining = await getPendingSync();
      setPendingCount(remaining.length);
    } catch {
      // Silently fail — will retry when online again
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const submitOrder = useCallback(async (order: OrderPayload) => {
    // Always save locally first
    await saveOfflineOrder(order.localId, order as unknown as Record<string, unknown>);
    await saveReceipt(order.localId, {
      ...order,
      total: order.payments.reduce((sum, payment) => sum + payment.amount, 0),
      createdAt: new Date().toISOString(),
      source: isOnline ? 'online_attempt' : 'offline',
    });
    const pending = await getPendingSync();
    setPendingCount(pending.length);

    // Try to sync immediately if online
    if (isOnline) {
      await syncPending();
    }
  }, [isOnline, syncPending]);

  const syncNow = useCallback(async () => {
    await syncPending();
  }, [syncPending]);

  return {
    submitOrder,
    syncPending,
    syncNow,
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
  };
}
