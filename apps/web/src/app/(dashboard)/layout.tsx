'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Briefcase, ClipboardList, LayoutDashboard, LogOut, Package, Receipt, Search, Settings, ShoppingCart, Truck, Users } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ToastProvider } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../lib/api';

const AiChatWidget = dynamic(
  () => import('../../components/ai/AiChatWidget').then((m) => m.AiChatWidget),
  { ssr: false },
);

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Órdenes', icon: ClipboardList },
  { href: '/analytics', label: 'Analíticas', icon: BarChart2 },
  { href: '/inventory', label: 'Inventario', icon: Package },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/employees', label: 'Empleados', icon: Briefcase },
  { href: '/suppliers', label: 'Proveedores', icon: Truck },
  { href: '/expenses', label: 'Gastos', icon: Receipt },
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/settings', label: 'Configuración', icon: Settings },
] as const;

function NavItem({ item, active }: { item: typeof NAV[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-md)] border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? 'border-[var(--gold-500)] bg-[rgba(201,168,76,0.08)] text-[var(--text-gold)]'
          : 'border-transparent text-[#8A887F] hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon size={18} className="flex-shrink-0" aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
    retry: false,
  });
  const activeLabel = NAV.find((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))?.label ?? 'Dashboard';

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      if (event.key === 'Escape') setPaletteOpen(false);
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  if (!isAuthenticated) return null;

  const initials = (profile?.name ?? user?.name ?? user?.email ?? 'N').slice(0, 1).toUpperCase();

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col overflow-hidden bg-[var(--bg-base)] lg:h-screen lg:flex-row">
        <div className="border-b border-white/10 bg-[#0A0A0A] text-white lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-medium tracking-tight text-[var(--text-gold)]">
                NEXUS
              </div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Premium POS</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gold-500)] text-sm font-semibold text-[#1A1400]" aria-label="Ir al perfil">
                {initials}
              </Link>
              <button onClick={() => void logout()} className="rounded-[var(--radius-md)] border border-white/10 px-3 py-2 text-xs font-medium text-white/80">
                Salir
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'page' : undefined}
                className={cn(
                  'inline-flex flex-none items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    ? 'border-[var(--gold-500)] bg-[rgba(201,168,76,0.12)] text-[var(--text-gold)]'
                    : 'border-white/10 bg-white/5 text-white/70',
                )}
              >
                <item.icon size={14} aria-hidden />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <aside className="hidden h-full w-[240px] flex-col bg-[#0A0A0A] text-white lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <div style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium tracking-tight text-[var(--text-gold)]">
              NEXUS
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/40">Premium POS</p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegación principal">
            {NAV.map((item) => (
              <NavItem key={item.href} item={item} active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))} />
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="mb-4 flex items-center gap-3 rounded-[var(--radius-lg)] bg-white/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gold-500)] font-semibold text-[#1A1400]">{initials}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{profile?.name ?? user?.name ?? user?.email ?? 'Usuario'}</p>
                <div className="mt-1 inline-flex rounded-full border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-gold)]">
                  {profile?.role ?? user?.role ?? 'Plan Pro'}
                </div>
              </div>
            </div>
            <button onClick={() => void logout()} className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/10 px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión">
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Panel</p>
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="truncate text-lg font-medium italic text-[var(--text-primary)]">
                {activeLabel}
              </h1>
            </div>

            <button onClick={() => setPaletteOpen(true)} className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-primary)] sm:inline-flex" aria-label="Abrir búsqueda global">
              <Search size={14} />
              Buscar
              <kbd className="rounded bg-[var(--bg-subtle)] px-1.5 py-0.5 text-xs text-[var(--text-tertiary)]">Cmd+K</kbd>
            </button>
            <ThemeToggle />
            <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)]" aria-label="Ir al perfil">
              {initials}
            </Link>
          </header>

          <main id="main-content" className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>

      {paletteOpen && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/40 p-4 pt-24" role="dialog" aria-modal="true" aria-labelledby="command-palette-title" onClick={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}>
          <div className="w-full max-w-xl rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
            <div className="border-b border-[var(--border-default)] px-4 py-3">
              <h2 id="command-palette-title" className="font-medium text-[var(--text-primary)]">Command palette</h2>
              <p className="text-sm text-[var(--text-secondary)]">Navega rápido con Cmd+K / Ctrl+K</p>
            </div>
            <div className="p-2">
              {NAV.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setPaletteOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                >
                  <item.icon size={18} className="text-[var(--text-secondary)]" />
                  <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <AiChatWidget />
    </ToastProvider>
  );
}
