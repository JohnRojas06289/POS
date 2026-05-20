'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart2, Package, Users, ShoppingCart, Settings } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { ToastProvider } from '../../components/ui/Toast';
import { useAuthStore } from '../../stores/auth.store';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analíticas', icon: BarChart2 },
  { href: '/inventory', label: 'Inventario', icon: Package },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/pos', label: 'POS', icon: ShoppingCart },
  { href: '/settings', label: 'Configuración', icon: Settings },
] as const;

function NavItem({ item, collapsed, active }: { item: typeof NAV[number]; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-[--radius-md] transition-all duration-150 group',
        'text-sm font-medium',
        active
          ? 'bg-[--nexus-500]/8 text-[--nexus-500] border-l-[3px] border-[--nexus-500] rounded-l-none'
          : 'text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon size={18} className="flex-shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <span className="sr-only">{item.label}</span>
      )}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nexus-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem('nexus-sidebar-collapsed', String(!v));
      return !v;
    });
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === href : pathname.startsWith(href);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[--bg-secondary] overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex flex-col h-full bg-[--bg-primary] border-r border-[--border] transition-all duration-200 flex-shrink-0',
            collapsed ? 'w-16' : 'w-[260px]',
          )}
        >
          {/* Logo */}
          <div className={cn('flex items-center gap-2 h-16 px-4 border-b border-[--border]', collapsed && 'justify-center px-2')}>
            <span className="text-xl font-bold text-[--nexus-500]">N</span>
            {!collapsed && (
              <div>
                <span className="text-base font-bold text-[--text-primary]">NEXUS</span>
                <span className="ml-2 text-xs bg-[--nexus-500]/10 text-[--nexus-500] px-1.5 py-0.5 rounded-full font-semibold">Pro</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1" aria-label="Navegación principal">
            {NAV.map((item) => (
              <NavItem key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
            ))}
          </nav>

          {/* User + collapse toggle */}
          <div className="border-t border-[--border] p-2 space-y-1">
            {!collapsed && user && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-[--radius-md]">
                <div className="w-8 h-8 rounded-full bg-[--nexus-500]/20 text-[--nexus-500] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[--text-primary] truncate">{user.name ?? user.email}</p>
                  <p className="text-xs text-[--text-tertiary] capitalize">{user.role}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => void logout()}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-[--radius-md] text-sm text-[--danger] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors',
                collapsed && 'justify-center',
              )}
              aria-label="Cerrar sesión"
            >
              <span aria-hidden>🚪</span>
              {!collapsed && 'Cerrar sesión'}
            </button>
            <button
              onClick={toggleCollapsed}
              className="w-full flex items-center justify-center py-2 text-[--text-tertiary] hover:text-[--text-primary] hover:bg-[--bg-tertiary] rounded-[--radius-md] transition-colors"
              aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              <span className={cn('text-sm transition-transform duration-200', collapsed ? 'rotate-180' : '')} aria-hidden>←</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <header className="h-16 flex-shrink-0 bg-[--bg-primary] border-b border-[--border] flex items-center px-6 gap-4">
            <div className="flex-1" />
            <ThemeToggle />
          </header>

          <main id="main-content" className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
