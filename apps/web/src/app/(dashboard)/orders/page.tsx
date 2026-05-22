'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { posApi } from '../../../lib/api';

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

const ORIGIN_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'counter', label: 'Mostrador' },
  { value: 'delivery', label: 'Domicilio' },
  { value: 'rappi', label: 'Rappi' },
  { value: 'didi', label: 'Didi' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('');
  const params: Record<string, string> = { limit: '100' };
  if (origin) params.origin = origin;
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'history', origin],
    queryFn: () => posApi.getOrders(params),
    retry: 1,
  });

  const orders = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const filtered = useMemo(
    () => orders.filter((order: { id: string; status: string; customerId?: string | null }) =>
      order.id.toLowerCase().includes(search.toLowerCase())
      || order.status.toLowerCase().includes(search.toLowerCase())
      || (order.customerId ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
    [orders, search],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Órdenes</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Historial reciente de ventas y estados.</p>
        </div>
        <Link href="/" className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]">
          Volver al dashboard
        </Link>
      </div>

      <Card variant="default" padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ID o estado..."
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">Origen</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none"
            >
              {ORIGIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-tertiary)]">
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3" colSpan={6}><Skeleton variant="table-row" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((order: { id: string; status: string; total: number; origin?: string; customerId?: string | null; createdAt?: string }) => (
                  <tr key={order.id} className="hover:bg-[var(--bg-subtle)]">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{order.status}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {ORIGIN_OPTIONS.find((o) => o.value === order.origin)?.label ?? order.origin ?? 'Mostrador'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{order.customerId ?? 'Sin cliente'}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{formatCOP(Number(order.total ?? 0))}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">No hay órdenes para mostrar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
