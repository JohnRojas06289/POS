'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, Clock3, Filter, Package2, Search, ShoppingBag, Wallet } from 'lucide-react';
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

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'completed', label: 'Completadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'hold', label: 'En espera' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'refunded', label: 'Reembolsadas' },
];

const RANGE_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: '7 días' },
  { value: 'month', label: '30 días' },
  { value: 'custom', label: 'Rango' },
];

type OrderRow = {
  id: string;
  status: string;
  total?: number;
  origin?: string;
  customerId?: string | null;
  createdAt?: string;
  cashierId?: string;
  items?: Array<{ id: string }>;
  payments?: Array<{ id: string }>;
};

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('');
  const [status, setStatus] = useState('');
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const derivedRange = (() => {
    if (range === 'today') {
      return { dateFrom: startOfDay.toISOString(), dateTo: now.toISOString() };
    }
    if (range === 'week') {
      return { dateFrom: new Date(startOfDay.getTime() - 6 * 86400000).toISOString(), dateTo: now.toISOString() };
    }
    if (range === 'month') {
      return { dateFrom: new Date(startOfDay.getTime() - 29 * 86400000).toISOString(), dateTo: now.toISOString() };
    }
    return {
      dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
      dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined,
    };
  })();

  const params: Record<string, string> = { limit: '100' };
  if (origin) params.origin = origin;
  if (status) params.status = status;
  if (derivedRange.dateFrom) params.dateFrom = derivedRange.dateFrom;
  if (derivedRange.dateTo) params.dateTo = derivedRange.dateTo;

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'history', origin, status, range, dateFrom, dateTo],
    queryFn: () => posApi.getOrders(params),
    retry: 1,
  });

  const orders: OrderRow[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

  const filtered = orders.filter((order) =>
    order.id.toLowerCase().includes(search.toLowerCase())
    || order.status.toLowerCase().includes(search.toLowerCase())
    || (order.customerId ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const totalSales = filtered.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const totalOrders = filtered.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
  const pendingCount = filtered.filter((order) => ['pending', 'hold'].includes(order.status)).length;
  const selectedOrder = selectedOrderId ? (filtered.find((order) => order.id === selectedOrderId) ?? null) : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Movimientos</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Centro de transacciones, estados, origen y detalle operativo.</p>
        </div>
        <Link href="/" className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]">
          Volver al dashboard
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Ventas', value: formatCOP(totalSales), icon: <Wallet size={18} /> },
          { label: 'Órdenes', value: totalOrders.toLocaleString('es-CO'), icon: <ShoppingBag size={18} /> },
          { label: 'Ticket promedio', value: formatCOP(averageTicket), icon: <Package2 size={18} /> },
          { label: 'Pendientes', value: pendingCount.toLocaleString('es-CO'), icon: <Clock3 size={18} /> },
        ].map((card) => (
          <Card key={card.label} variant="default" padding="lg" className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{card.value}</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-subtle)] text-[var(--text-gold)]">
              {card.icon}
            </span>
          </Card>
        ))}
      </div>

      <Card variant="default" padding="md">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative min-w-[180px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ID, estado o cliente..."
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-[var(--text-tertiary)]" />
            <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none">
              {RANGE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[var(--text-tertiary)]" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none">
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ORIGIN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setOrigin(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${origin === opt.value ? 'border-[var(--border-gold)] bg-[var(--bg-subtle)] text-[var(--text-gold)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-gold)]'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--text-secondary)]">
              Desde
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none" />
            </label>
            <label className="text-xs text-[var(--text-secondary)]">
              Hasta
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-gold)] focus:outline-none" />
            </label>
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card variant="default" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-tertiary)]">
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3" colSpan={7}><Skeleton variant="table-row" /></td>
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className={`cursor-pointer hover:bg-[var(--bg-subtle)] ${selectedOrderId === order.id ? 'bg-[var(--bg-subtle)]' : ''}`}>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{order.status}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {ORIGIN_OPTIONS.find((o) => o.value === order.origin)?.label ?? order.origin ?? 'Mostrador'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{order.customerId ?? 'Sin cliente'}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{order.items?.length ?? 0}</td>
                      <td className="px-4 py-3 text-[var(--text-primary)]">{formatCOP(Number(order.total ?? 0))}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">No hay movimientos para mostrar</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          {selectedOrder ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Detalle del movimiento</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{selectedOrder.id.slice(0, 8)}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('es-CO') : '—'}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Estado</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{selectedOrder.status}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Origen</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{ORIGIN_OPTIONS.find((o) => o.value === selectedOrder.origin)?.label ?? selectedOrder.origin ?? 'Mostrador'}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Items</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{selectedOrder.items?.length ?? 0}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Pagos</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{selectedOrder.payments?.length ?? 0}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Resumen</p>
                <div className="mt-3 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                  Total: <span className="font-semibold text-[var(--text-primary)]">{formatCOP(Number(selectedOrder.total ?? 0))}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]"
              >
                Cerrar detalle <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-start justify-center gap-3 text-[var(--text-secondary)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-gold)]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Selecciona un movimiento</p>
                <p className="mt-1 text-sm">Aquí verás el resumen, los ítems y los pagos.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
