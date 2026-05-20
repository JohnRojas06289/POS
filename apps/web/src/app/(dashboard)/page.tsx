'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign } from 'lucide-react';
import { Card } from '../../components/ui/Card';

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
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

const salesData = [
  { day: 'Lun', ventas: 1200000, ordenes: 28 },
  { day: 'Mar', ventas: 1850000, ordenes: 42 },
  { day: 'Mié', ventas: 1400000, ordenes: 35 },
  { day: 'Jue', ventas: 2100000, ordenes: 51 },
  { day: 'Vie', ventas: 2800000, ordenes: 67 },
  { day: 'Sáb', ventas: 3200000, ordenes: 78 },
  { day: 'Dom', ventas: 1600000, ordenes: 39 },
];

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

interface KpiCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number';
  delta: number;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({ title, value, format = 'number', delta, icon, color }: KpiCardProps) {
  const animated = useCountUp(value);
  const positive = delta >= 0;

  return (
    <Card variant="default" padding="lg" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[--text-secondary]">{title}</span>
        <span className={`w-9 h-9 rounded-[--radius-md] flex items-center justify-center ${color}`}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[--text-primary] tabular-nums">
          {format === 'currency' ? formatCOP(animated) : animated.toLocaleString('es-CO')}
        </p>
        <p className={`text-xs mt-1 flex items-center gap-1 ${positive ? 'text-[--success]' : 'text-[--danger]'}`}>
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
    <div className="bg-[--bg-primary] border border-[--border] rounded-[--radius-md] px-3 py-2 shadow-[--shadow-md]">
      <p className="text-xs font-medium text-[--text-secondary] mb-1">{label}</p>
      <p className="text-sm font-bold text-[--text-primary]">{formatCOP(payload[0].value)}</p>
    </div>
  );
};

const recentOrders = [
  { id: '#1842', customer: 'Mesa 3', items: 4, total: 128000, status: 'pagado', time: '14:32' },
  { id: '#1841', customer: 'Mesa 7', items: 2, total: 67500, status: 'pagado', time: '14:18' },
  { id: '#1840', customer: 'Domicilio', items: 6, total: 245000, status: 'en preparación', time: '14:05' },
  { id: '#1839', customer: 'Mesa 1', items: 3, total: 89000, status: 'pagado', time: '13:52' },
  { id: '#1838', customer: 'Mesa 5', items: 5, total: 176000, status: 'pagado', time: '13:41' },
];

const statusStyles: Record<string, string> = {
  'pagado': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'en preparación': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'cancelado': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function DashboardHome() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--text-primary]">Dashboard</h1>
        <p className="text-sm text-[--text-secondary] mt-0.5">Hoy, {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Ventas del día" value={2847000} format="currency" delta={12.5} icon={<DollarSign size={18} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-900/30" />
        <KpiCard title="Órdenes" value={67} delta={8.2} icon={<ShoppingCart size={18} className="text-green-600" />} color="bg-green-50 dark:bg-green-900/30" />
        <KpiCard title="Clientes" value={54} delta={-2.1} icon={<Users size={18} className="text-purple-600" />} color="bg-purple-50 dark:bg-purple-900/30" />
        <KpiCard title="Productos vendidos" value={143} delta={5.7} icon={<Package size={18} className="text-orange-600" />} color="bg-orange-50 dark:bg-orange-900/30" />
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Area Chart */}
        <Card variant="default" padding="lg" className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[--text-primary]">Ventas — últimos 7 días</h2>
            <span className="text-xs bg-[--bg-tertiary] text-[--text-secondary] px-2 py-1 rounded-full">Esta semana</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="nexusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--nexus-500)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--nexus-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventas" stroke="var(--nexus-500)" strokeWidth={2} fill="url(#nexusGradient)" dot={false} activeDot={{ r: 4, fill: 'var(--nexus-500)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Orders */}
        <Card variant="default" padding="lg">
          <h2 className="text-base font-semibold text-[--text-primary] mb-4">Órdenes recientes</h2>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-[--border] last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[--text-primary] flex items-center gap-2">
                    {order.id}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-normal ${statusStyles[order.status] ?? ''}`}>
                      {order.status}
                    </span>
                  </p>
                  <p className="text-xs text-[--text-tertiary] mt-0.5">{order.customer} · {order.items} items · {order.time}</p>
                </div>
                <p className="text-sm font-semibold text-[--text-primary] flex-shrink-0 ml-2">
                  {formatCOP(order.total)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
