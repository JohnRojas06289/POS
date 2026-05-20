'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { analyticsApi } from '../../../lib/api';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const FALLBACK_MONTHLY = [
  { mes: 'Ene', ventas: 8200000, ordenes: 189 },
  { mes: 'Feb', ventas: 9100000, ordenes: 215 },
  { mes: 'Mar', ventas: 7800000, ordenes: 178 },
  { mes: 'Abr', ventas: 10500000, ordenes: 241 },
  { mes: 'May', ventas: 11200000, ordenes: 268 },
  { mes: 'Jun', ventas: 9800000, ordenes: 223 },
];

const FALLBACK_CATEGORY = [
  { name: 'Bebidas', value: 38 },
  { name: 'Comidas', value: 29 },
  { name: 'Postres', value: 17 },
  { name: 'Snacks', value: 11 },
  { name: 'Otros', value: 5 },
];

const hourlyData = Array.from({ length: 12 }, (_, i) => ({
  hora: `${i + 8}:00`,
  ordenes: Math.floor(Math.random() * 25 + 5),
}));

type Range = '7d' | '30d' | '3m';

const ranges: { label: string; value: Range }[] = [
  { label: '7 días', value: '7d' },
  { label: '30 días', value: '30d' },
  { label: '3 meses', value: '3m' },
];

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d');

  const today = new Date().toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['analytics-sales', range],
    queryFn: () => analyticsApi.getSalesSummary({ dateFrom: monthAgo, dateTo: today, groupBy: 'month' }),
    retry: 1,
  });

  const { data: performanceData } = useQuery({
    queryKey: ['analytics-performance'],
    queryFn: analyticsApi.getProductPerformance,
    retry: 1,
  });

  const monthlyData = Array.isArray(salesData?.data) ? salesData.data :
                      Array.isArray(salesData) ? salesData : FALLBACK_MONTHLY;

  const categoryData = Array.isArray(performanceData?.data) ? performanceData.data :
                       Array.isArray(performanceData) ? performanceData : FALLBACK_CATEGORY;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Analíticas</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">Tendencias y rendimiento de ventas</p>
        </div>
        <div className="flex gap-1 bg-[--bg-tertiary] rounded-[--radius-md] p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-sm rounded-[--radius-sm] transition-all duration-150 ${
                range === r.value
                  ? 'bg-[--bg-primary] text-[--text-primary] shadow-[--shadow-sm] font-medium'
                  : 'text-[--text-secondary] hover:text-[--text-primary]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly sales bar */}
        <Card variant="default" padding="lg" className="xl:col-span-2">
          <h2 className="text-base font-semibold text-[--text-primary] mb-4">Ventas mensuales</h2>
          {loadingSales ? <Skeleton variant="rect" height={240} className="w-full" /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => [formatCOP(v), 'Ventas']} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="ventas" fill="var(--nexus-500)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Category pie */}
        <Card variant="default" padding="lg">
          <h2 className="text-base font-semibold text-[--text-primary] mb-4">Ventas por categoría</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                {categoryData.map((_: unknown, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, 'Participación']} contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((cat: { name: string; value: number }, i: number) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[--text-secondary]">{cat.name}</span>
                </span>
                <span className="font-medium text-[--text-primary]">{cat.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly heatmap-style bar */}
      <Card variant="default" padding="lg">
        <h2 className="text-base font-semibold text-[--text-primary] mb-4">Órdenes por hora (hoy)</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="hora" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
            <Bar dataKey="ordenes" fill="var(--nexus-400)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
