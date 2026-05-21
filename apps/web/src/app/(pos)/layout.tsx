'use client';

import { useEffect, useState } from 'react';
import { Badge } from '../../components/ui';
import { OfflineBanner } from '../../components/OfflineBanner';
import { useAuthStore } from '../../stores/auth.store';
import { useOfflineStore } from '../../stores/offline.store';
import { useSessionStore } from '../../stores/session.store';
import { ToastProvider, useToast } from '../../components/ui/Toast';

function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    update();
    const iv = window.setInterval(update, 1000);
    return () => window.clearInterval(iv);
  }, []);
  return <span style={{ fontFamily: 'var(--font-mono)' }} className="text-sm text-white/75">{time}</span>;
}

function PosHeader() {
  const { user, branch } = useAuthStore();
  const { isOnline, pendingCount } = useOfflineStore();
  const { currentSession, closeSession } = useSessionStore();
  const { toast } = useToast();

  const initials = (user?.name ?? user?.email ?? 'C').slice(0, 1).toUpperCase();

  const handleCloseCash = async () => {
    const raw = window.prompt('Efectivo de cierre');
    if (raw === null) return;
    const closingCash = Number(raw.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (Number.isNaN(closingCash)) {
      toast('Ingresa un valor válido', 'warning');
      return;
    }
    try {
      await closeSession(closingCash);
      toast('Caja cerrada', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No se pudo cerrar la caja', 'error');
    }
  };

  return (
    <header className="flex h-14 items-center border-b border-white/10 bg-[#0A0A0A] px-4 text-white">
      <div className="flex min-w-0 items-center gap-2">
        <span style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-medium tracking-tight text-[var(--text-gold)]">NEXUS</span>
        <span className="text-white/30">/</span>
        <span className="truncate text-sm text-white/75">{branch?.name ?? 'Sucursal'}</span>
      </div>

      <div className="hidden flex-1 items-center justify-center gap-3 md:flex">
        <Clock />
        <Badge variant={isOnline ? 'success' : 'warning'} dot pulse={!isOnline}>{isOnline ? (pendingCount > 0 ? `Sync ${pendingCount}` : 'Online') : 'Offline'}</Badge>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-white">{user.name ?? user.email}</p>
            <p className="text-xs text-white/45">Cajero</p>
          </div>
        )}
        {currentSession && (
          <Badge variant="gold">Caja abierta</Badge>
        )}
        <button onClick={() => void handleCloseCash()} className="rounded-[var(--radius-md)] border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.12)] px-3 py-2 text-sm font-semibold text-[var(--text-gold)] transition-colors hover:bg-[rgba(201,168,76,0.18)]">
          Cerrar caja
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-500)] text-sm font-semibold text-[#1A1400]">{initials}</div>
      </div>
    </header>
  );
}

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <ToastProvider>
      <OfflineBanner />
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-base)]">
        <PosHeader />
        <main className="min-h-0 flex-1 overflow-hidden" id="main-content">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
