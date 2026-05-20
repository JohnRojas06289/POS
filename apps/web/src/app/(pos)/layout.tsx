'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '../../components/ui';
import { useAuthStore } from '../../stores/auth.store';
import { useOfflineStore } from '../../stores/offline.store';
import { ToastProvider } from '../../components/ui/Toast';

function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }));
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, []);
  return <span className="font-mono text-sm text-[--text-secondary]">{time}</span>;
}

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { user, branch } = useAuthStore();
  const { isOnline, pendingCount } = useOfflineStore();

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-[--bg-secondary] overflow-hidden">
        {/* Header — 56px */}
        <header className="h-14 flex-shrink-0 bg-[--bg-primary] border-b border-[--border] flex items-center px-4 gap-4 shadow-[--shadow-sm]">
          {/* Left */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-bold text-[--nexus-500] font-sans flex-shrink-0">NEXUS</span>
            {branch && (
              <>
                <span className="text-[--border-strong]">/</span>
                <span className="text-sm text-[--text-secondary] truncate">{branch.name ?? 'Sucursal'}</span>
              </>
            )}
          </div>

          {/* Center */}
          <div className="flex-1 flex items-center justify-center gap-2">
            {user && (
              <span className="text-sm text-[--text-secondary]">
                <span className="font-medium text-[--text-primary]">{user.name ?? user.email}</span>
                {' · '}
                <span className="capitalize">{user.role}</span>
              </span>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Clock />
            <Badge
              variant={isOnline ? 'success' : 'warning'}
              dot
              pulse={!isOnline}
            >
              {isOnline
                ? pendingCount > 0 ? `Sync ${pendingCount}` : 'Online'
                : 'Offline'}
            </Badge>
            <Link
              href="/dashboard"
              className="text-sm text-[--text-secondary] hover:text-[--text-primary] transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* POS content — full remaining height */}
        <main className="flex-1 overflow-hidden" id="main-content">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
