import { useState, useCallback, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { getPendingSync, markSynced, saveOfflineOrder } from '../database/local.db';

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

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
      if (online) void syncPending();
    });
    return () => unsub();
  }, []);

  const syncPending = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const pending = await getPendingSync();
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
    } catch {
      // Silently fail — will retry when online again
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  const submitOrder = useCallback(async (order: OrderPayload) => {
    // Always save locally first
    await saveOfflineOrder(order.localId, order as unknown as Record<string, unknown>);

    // Try to sync immediately if online
    if (isOnline) {
      await syncPending();
    }
  }, [isOnline, syncPending]);

  return { submitOrder, syncPending, isOnline, isSyncing };
}
