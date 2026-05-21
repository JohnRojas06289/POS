'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { KPICard } from '../../../components/ui/KPICard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { analyticsApi } from '../../../lib/api';

// CountUp animation hook
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return value;
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// Fallback static chart data (shows shape when API is empty)
const FALLBACK_CHART = [
  { day: 'Lun', ventas: 0, ordenes: 0 },
  { day: 'Mar', ventas: 0, ordenes: 0 },
  { day: 'Mié', ventas: 0, ordenes: 0 },
  { day: 'Jue', ventas: 0, ordenes: 0 },
  { day: 'Vie', ventas: 0, ordenes: 0 },
  { day: 'Sáb', ventas: 0, ordenes: 0 },
  { day: 'Dom', ventas: 0, ordenes: 0 },
];

interface KpiCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number';
  delta: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function KpiCard({ title, value, format = 'number', delta, icon, color, loading }: KpiCardProps) {
  const animated = useCountUp(value);
  const positive = delta >= 0;
  if (loading) return <Card variant="default" padding="lg"><Skeleton variant="card" /></Card>;
  return (
    <Card variant="default" padding="lg" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-secondary)]">{title}</span>
        <span className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center ${color}`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
          {format === 'currency' ? formatCOP(animated) : animated.toLocaleString('es-CO')}
        </p>
        <p className={`text-xs mt-1 flex items-center gap-1 ${positive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {positive ? '+' : ''}{delta}% vs semana anterior
        </p>
      </div>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-sm font-bold text-[var(--text-primary)]">{formatCOP(payload[0].value)}</p>
    </div>
  );
};

interface SalesSummary {
  totalSales?: number;
  totalOrders?: number;
  totalCustomers?: number;
  totalProducts?: number;
  salesDelta?: number;
  ordersDelta?: number;
  customersDelta?: number;
  productsDelta?: number;
  salesByDay?: Array<{ day: string; ventas: number; ordenes: number }>;
  recentOrders?: Array<{ id: string; customer: string; items: number; total: number; status: string; time: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'pagado': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'en preparación': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function DashboardHome() {
  const { toast } = useToast();
  const today = new Date();
  const params = {
    dateFrom: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString(),
    dateTo: today.toISOString(),
    groupBy: 'day',
  };

  const { data, isLoading, isError } = useQuery<SalesSummary>({
    queryKey: ['dashboard-summary', params.dateFrom],
    queryFn: () => analyticsApi.getSalesSummary(params),
    retry: 1,
  });

  React.useEffect(() => {
    if (isError) toast('No se pudo cargar el resumen de ventas', 'error');
  }, [isError, toast]);

  const chartData = data?.salesByDay ?? FALLBACK_CHART;
  const recentOrders = (data?.recentOrders ?? []).slice(0, 3);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-medium tracking-tight text-[var(--text-primary)]">Dashboard</h1>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          Hoy, {today.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Ventas del día" value={formatCOP(data?.totalSales ?? 0)} delta={`${data?.salesDelta ?? 0}%`} deltaType={(data?.salesDelta ?? 0) >= 0 ? 'up' : 'down'} icon={<DollarSign size={18} />} />
        <KPICard label="Órdenes" value={(data?.totalOrders ?? 0).toLocaleString('es-CO')} delta={`${data?.ordersDelta ?? 0}%`} deltaType={(data?.ordersDelta ?? 0) >= 0 ? 'up' : 'down'} icon={<ShoppingCart size={18} />} />
        <KPICard label="Clientes" value={(data?.totalCustomers ?? 0).toLocaleString('es-CO')} delta={`${data?.customersDelta ?? 0}%`} deltaType={(data?.customersDelta ?? 0) >= 0 ? 'up' : 'down'} icon={<Users size={18} />} />
        <KPICard label="Productos vendidos" value={(data?.totalProducts ?? 0).toLocaleString('es-CO')} delta={`${data?.productsDelta ?? 0}%`} deltaType={(data?.productsDelta ?? 0) >= 0 ? 'up' : 'down'} icon={<Package size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card variant="default" padding="lg" className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-base font-medium text-[var(--text-primary)]">Ventas - últimos 7 días</h2>
            <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)]">Esta semana</span>
          </div>
          {isLoading ? <Skeleton variant="rect" height={220} className="w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="nexusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ventas" stroke="#C9A84C" strokeWidth={2.5} fill="url(#nexusGradient)" dot={false} activeDot={{ r: 4, fill: '#C9A84C' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card variant="default" padding="lg">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-base font-medium text-[var(--text-primary)]">Órdenes recientes</h2>
            <Link href="/orders" className="text-xs font-medium text-[var(--text-gold)] hover:underline">
              Ver más
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="table-row" />)}</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingCart size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">Sin órdenes hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-[var(--border-default)] py-2 last:border-0">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                      #{order.id.slice(-4)}
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-normal ${STATUS_STYLES[order.status] ?? 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'}`}>{order.status}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{order.customer} · {order.items} items · {order.time}</p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)' }} className="ml-2 flex-shrink-0 text-sm font-semibold text-[var(--text-primary)]">{formatCOP(order.total)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
