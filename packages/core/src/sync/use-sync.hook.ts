import { useState, useEffect, useCallback, useRef } from 'react';
import { MobileSyncService } from './sync.service';

interface SyncHookState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
}

export function useSync(
  apiUrl: string,
  getToken: () => string | null,
  branchId: string,
): SyncHookState & { syncNow: () => Promise<void> } {
  const serviceRef = useRef<MobileSyncService | null>(null);
  const [syncState, setSyncState] = useState<SyncHookState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
  });

  useEffect(() => {
    const service = new MobileSyncService(apiUrl, getToken);
    serviceRef.current = service;

    const unsubscribe = service.subscribe((state) => setSyncState(state));
    return unsubscribe;
  }, [apiUrl]);

  const syncNow = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.syncNow(branchId);
    }
  }, [branchId]);

  return { ...syncState, syncNow };
}
