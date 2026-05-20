'use client';

import { useEffect } from 'react';
import { useOfflineStore } from '../stores/offline.store';
import { cn } from '../lib/cn';

export function useOnlineStatus() {
  const setOnline = useOfflineStore((s) => s.setOnline);
  const syncPending = useOfflineStore((s) => s.syncPending);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      void syncPending();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, syncPending]);
}

export function OfflineBanner() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const pendingCount = useOfflineStore((s) => s.pendingCount);
  const isSyncing = useOfflineStore((s) => s.isSyncing);

  useOnlineStatus();

  if (isOnline && !isSyncing) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 py-2 px-4 text-sm font-medium text-center',
        isSyncing
          ? 'bg-blue-500 text-white'
          : 'bg-yellow-400 text-yellow-900',
      )}
    >
      {isSyncing
        ? `Sincronizando ${pendingCount} venta${pendingCount !== 1 ? 's' : ''}...`
        : `Sin conexión — ${pendingCount} venta${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`}
    </div>
  );
}
