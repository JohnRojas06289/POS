'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  Loader2,
  Package2,
  Printer,
  RotateCcw,
  Search,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Receipt, type ReceiptData } from '../../../components/pos/Receipt';
import { posApi, tenantsApi } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-CO');
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

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Todos los pagos' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'credit_store', label: 'Fiado' },
];

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-300 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  hold: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  cancelled: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  refunded: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
};

type OrderPayment = {
  id: string;
  method: string;
  amount: number;
  reference?: string | null;
};

type OrderItemBase = {
  id: string;
  notes?: string | null;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  total?: number;
  productName?: string;
  variantName?: string;
  sku?: string | null;
};

type OrderRow = {
  id: string;
  branchId: string;
  status: string;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  total?: number;
  chargedTotal?: number;
  tipAmount?: number | null;
  tipPercentage?: number | null;
  changeDue?: number | null;
  origin?: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  tableNumber?: number | null;
  notes?: string | null;
  createdAt?: string;
  cashierId?: string;
  items?: OrderItemBase[];
  payments?: OrderPayment[];
};

type OrderDetailItem = OrderItemBase & {
  variantId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  productName: string;
  variantName: string;
  sku?: string | null;
};

type OrderDetail = OrderRow & {
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  table?: {
    id: string;
    number: number;
    notes?: string | null;
  } | null;
  items: OrderDetailItem[];
  payments: OrderPayment[];
};

function buildReceiptData(
  detail: OrderDetail,
  businessName: string,
  branchName?: string,
): ReceiptData {
  const itemDiscountTotal = detail.items.reduce((sum, item) => sum + Number(item.discount ?? 0), 0);
  const discountTotal = Number(detail.discountTotal ?? 0);
  const tipAmount = Number(detail.tipAmount ?? 0);
  const chargedTotal = Number(detail.chargedTotal ?? (Number(detail.total ?? 0) + tipAmount));

  return {
    txId: detail.id.slice(0, 8),
    createdAt: detail.createdAt ?? new Date().toISOString(),
    businessName,
    branchName,
    items: detail.items.map((item) => ({
      productName: item.productName ?? 'Producto',
      variantName: item.variantName ?? 'Variante',
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountAmount: Number(item.discount ?? 0),
    })),
    payments: detail.payments.map((payment) => ({
      method: payment.method,
      amount: Number(payment.amount),
    })),
    subtotal: Number(detail.subtotal ?? 0),
    itemDiscountTotal,
    cartDiscountAmount: Math.max(0, discountTotal - itemDiscountTotal),
    tipAmount,
    tipPercentage: detail.tipPercentage ? Number(detail.tipPercentage) : undefined,
    total: chargedTotal,
    change: Number(detail.changeDue ?? 0),
  };
}

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'hold' | 'resume' | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

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

  const { data: selectedDetailRaw, isLoading: loadingDetail } = useQuery({
    queryKey: ['order-detail', selectedOrderId],
    queryFn: () => posApi.getOrder(selectedOrderId!),
    enabled: Boolean(selectedOrderId),
    retry: 1,
  });

  const { data: configData } = useQuery({
    queryKey: ['tenant-config-movements'],
    queryFn: tenantsApi.getConfig,
    retry: false,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['tenant-branches-movements'],
    queryFn: tenantsApi.getBranches,
    retry: false,
  });

  const config = (configData ?? {}) as { name?: string; businessName?: string };
  const branches = Array.isArray(branchesData) ? branchesData as Array<{ id: string; name: string }> : [];
  const orders: OrderRow[] = Array.isArray((data as { data?: unknown[] } | undefined)?.data)
    ? (data as { data: OrderRow[] }).data
    : Array.isArray(data)
      ? data as OrderRow[]
      : [];

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = [
        order.id,
        order.status,
        order.customerId ?? '',
        order.customerName ?? '',
        order.customerPhone ?? '',
      ].join(' ').toLowerCase().includes(search.toLowerCase());

      const matchesPayment = !paymentMethod
        || (order.payments ?? []).some((payment) => payment.method === paymentMethod);

      return matchesSearch && matchesPayment;
    });
  }, [orders, paymentMethod, search]);

  const totalSales = filtered.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const totalOrders = filtered.length;
  const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
  const pendingCount = filtered.filter((order) => ['pending', 'hold'].includes(order.status)).length;
  const selectedOrder = selectedOrderId ? (filtered.find((order) => order.id === selectedOrderId) ?? null) : null;
  const selectedDetail = (selectedDetailRaw ?? null) as OrderDetail | null;

  const branchName = selectedDetail?.branchId
    ? branches.find((branch) => branch.id === selectedDetail.branchId)?.name
    : undefined;

  const handleToggleHold = async () => {
    if (!selectedDetail) return;
    const nextAction = selectedDetail.status === 'hold' ? 'resume' : 'hold';
    setActionLoading(nextAction);
    try {
      if (nextAction === 'hold') {
        await posApi.holdOrder(selectedDetail.id);
        toast('Movimiento enviado a espera', 'success');
      } else {
        await posApi.resumeOrder(selectedDetail.id);
        toast('Movimiento reanudado', 'success');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['order-detail', selectedDetail.id] }),
      ]);
    } catch {
      toast('No fue posible actualizar el estado del movimiento', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrintReceipt = () => {
    if (!selectedDetail) return;
    setReceiptData(
      buildReceiptData(
        selectedDetail,
        config.businessName ?? config.name ?? 'NEXUS POS',
        branchName,
      ),
    );
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast('No hay movimientos para exportar', 'warning');
      return;
    }

    const rows = [
      ['id', 'fecha', 'estado', 'origen', 'cliente', 'mesa', 'items', 'total', 'pagos'].join(','),
      ...filtered.map((order) => [
        order.id,
        order.createdAt ?? '',
        order.status,
        order.origin ?? '',
        `"${order.customerName ?? order.customerId ?? 'Sin cliente'}"`,
        order.tableNumber ?? '',
        order.items?.length ?? 0,
        Number(order.chargedTotal ?? order.total ?? 0),
        `"${(order.payments ?? []).map((payment) => payment.method).join(' | ')}"`,
      ].join(',')),
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canToggleHold = selectedDetail ? ['pending', 'completed', 'hold'].includes(selectedDetail.status) : false;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Movimientos</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Centro de transacciones, pagos, clientes y detalle operativo.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]"
          >
            <Download size={15} /> Exportar CSV
          </button>
          <Link href="/" className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]">
            Volver al dashboard
          </Link>
        </div>
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
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
          <div className="relative min-w-[180px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ID, estado, cliente o teléfono..."
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {PAYMENT_METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              onClick={() => setPaymentMethod(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${paymentMethod === opt.value ? 'border-[var(--border-gold)] bg-[var(--bg-subtle)] text-[var(--text-gold)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-gold)]'}`}
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

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card variant="default" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-tertiary)]">
                  <th className="px-4 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Pagos</th>
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
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[order.status] ?? 'border-[var(--border-default)] text-[var(--text-secondary)]'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {ORIGIN_OPTIONS.find((o) => o.value === order.origin)?.label ?? order.origin ?? 'Mostrador'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        <div>
                          <p className="text-[var(--text-primary)]">{order.customerName ?? 'Sin cliente'}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">{order.customerPhone ?? order.customerId ?? ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{(order.payments ?? []).map((payment) => payment.method).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-primary)]">{formatCOP(Number(order.chargedTotal ?? order.total ?? 0))}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDateTime(order.createdAt)}</td>
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
          {!selectedOrderId ? (
            <div className="flex h-full min-h-[220px] flex-col items-start justify-center gap-3 text-[var(--text-secondary)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-gold)]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Selecciona un movimiento</p>
                <p className="mt-1 text-sm">Aquí verás clientes, ítems, pagos y acciones operativas.</p>
              </div>
            </div>
          ) : loadingDetail ? (
            <div className="space-y-3">
              <Skeleton variant="text" lines={2} />
              <Skeleton variant="card" />
              <Skeleton variant="text" lines={6} />
            </div>
          ) : selectedDetail ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Detalle del movimiento</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{selectedDetail.id.slice(0, 8)}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{formatDateTime(selectedDetail.createdAt)}</p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[selectedDetail.status] ?? 'border-[var(--border-default)] text-[var(--text-secondary)]'}`}>
                  {selectedDetail.status}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Cliente</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{selectedDetail.customer?.name ?? selectedDetail.customerName ?? 'Sin cliente'}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{selectedDetail.customer?.phone ?? selectedDetail.customer?.email ?? selectedDetail.customerId ?? '—'}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Origen / Mesa</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{ORIGIN_OPTIONS.find((o) => o.value === selectedDetail.origin)?.label ?? selectedDetail.origin ?? 'Mostrador'}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{selectedDetail.tableNumber ? `Mesa ${selectedDetail.tableNumber}` : 'Sin mesa'}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Items</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{selectedDetail.items.length}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Cajero: {selectedDetail.cashierId ?? '—'}</p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Pagos</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{selectedDetail.payments.length}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{selectedDetail.payments.map((payment) => payment.method).join(', ') || '—'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]"
                >
                  <Printer size={15} /> Recibo
                </button>
                {canToggleHold && (
                  <button
                    type="button"
                    onClick={() => void handleToggleHold()}
                    disabled={Boolean(actionLoading)}
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)] disabled:opacity-60"
                  >
                    {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
                    {selectedDetail.status === 'hold' ? 'Reanudar' : 'Poner en espera'}
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Ítems vendidos</p>
                <div className="mt-3 space-y-2">
                  {selectedDetail.items.length > 0 ? selectedDetail.items.map((item) => (
                    <div key={item.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{item.productName}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{item.variantName} · {item.sku ?? 'Sin SKU'}</p>
                          {item.notes && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{item.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCOP(Number(item.total ?? 0))}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{item.quantity} × {formatCOP(Number(item.unitPrice ?? 0))}</p>
                          {Number(item.discount ?? 0) > 0 && <p className="text-xs text-emerald-300">Desc: -{formatCOP(Number(item.discount ?? 0))}</p>}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 text-sm text-[var(--text-tertiary)]">
                      No hay ítems cargados para este movimiento.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Pagos recibidos</p>
                  <div className="mt-3 space-y-2">
                    {selectedDetail.payments.length > 0 ? selectedDetail.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-default)] p-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{payment.method}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{payment.reference ?? 'Sin referencia'}</p>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCOP(Number(payment.amount ?? 0))}</p>
                      </div>
                    )) : (
                      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 text-sm text-[var(--text-tertiary)]">
                        No hay pagos registrados.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Resumen</p>
                  <div className="mt-3 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[var(--text-primary)]">{formatCOP(Number(selectedDetail.subtotal ?? 0))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Descuentos</span>
                      <span className="font-semibold text-[var(--text-primary)]">-{formatCOP(Number(selectedDetail.discountTotal ?? 0))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Impuestos</span>
                      <span className="font-semibold text-[var(--text-primary)]">{formatCOP(Number(selectedDetail.taxTotal ?? 0))}</span>
                    </div>
                    {Number(selectedDetail.tipAmount ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Propina</span>
                        <span className="font-semibold text-[var(--text-primary)]">
                          {formatCOP(Number(selectedDetail.tipAmount ?? 0))}
                          {selectedDetail.tipPercentage ? ` · ${selectedDetail.tipPercentage}%` : ''}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-[var(--border-default)] pt-2 flex items-center justify-between">
                      <span className="font-medium text-[var(--text-primary)]">Total</span>
                      <span className="font-semibold text-[var(--text-primary)]">{formatCOP(Number(selectedDetail.chargedTotal ?? selectedDetail.total ?? 0))}</span>
                    </div>
                    {Number(selectedDetail.changeDue ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Vuelto</span>
                        <span className="font-semibold text-[var(--text-primary)]">{formatCOP(Number(selectedDetail.changeDue ?? 0))}</span>
                      </div>
                    )}
                    {selectedDetail.notes && (
                      <div className="border-t border-[var(--border-default)] pt-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Notas</p>
                        <p className="mt-1 text-sm text-[var(--text-primary)]">{selectedDetail.notes}</p>
                      </div>
                    )}
                  </div>
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
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 text-sm text-[var(--text-tertiary)]">
              No se pudo cargar el detalle del movimiento.
            </div>
          )}
        </Card>
      </div>

      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReceiptData(null)}>
          <div className="max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <Receipt data={receiptData} onClose={() => setReceiptData(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
