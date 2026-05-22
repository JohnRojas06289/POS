'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, X, Loader2, Eye, RefreshCw, ArrowRightLeft, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { quotesApi, customersApi, tenantsApi } from '../../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface Quote {
  id: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  customerId?: string | null;
  customerName?: string | null;
  total: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  notes?: string | null;
  validUntil?: string | null;
  items: QuoteItem[];
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviada' },
  { value: 'accepted', label: 'Aceptada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'expired', label: 'Vencida' },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' },
  sent: { label: 'Enviada', cls: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700' },
  accepted: { label: 'Aceptada', cls: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700' },
  rejected: { label: 'Rechazada', cls: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700' },
  expired: { label: 'Vencida', cls: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Empty Item ───────────────────────────────────────────────

function emptyItem(): QuoteItem {
  return { description: '', quantity: 1, unitPrice: 0, discount: 0 };
}

// ─── Nueva Cotización Modal ───────────────────────────────────

function NewQuoteModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { data: customersRaw } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.getCustomers(),
    retry: 1,
  });

  const customers: Customer[] = useMemo(() => {
    const raw = customersRaw as unknown;
    const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : [];
    return arr.map((c) => ({
      id: String((c as { id?: unknown }).id ?? ''),
      name: String((c as { name?: unknown }).name ?? 'Cliente'),
    })).filter((c) => c.id);
  }, [customersRaw]);

  const updateItem = (idx: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const itemTotal = (item: QuoteItem) => {
    const base = item.quantity * item.unitPrice;
    return base - (base * (item.discount / 100));
  };

  const subtotal = items.reduce((s, item) => s + itemTotal(item), 0);
  const discountTotal = items.reduce((s, item) => s + (item.quantity * item.unitPrice * item.discount / 100), 0);
  const taxTotal = subtotal * 0.19;
  const total = subtotal + taxTotal;

  const handleSave = async () => {
    if (items.length === 0 || items.every((i) => !i.description)) {
      toast('Agrega al menos un ítem con descripción', 'error');
      return;
    }
    setSaving(true);
    try {
      await quotesApi.create({
        customerId: customerId || undefined,
        notes: notes || undefined,
        validUntil: validUntil || undefined,
        items: items.filter((i) => i.description),
        subtotal,
        discountTotal,
        taxTotal,
        total,
      });
      toast('Cotización creada', 'success');
      onSave();
    } catch {
      toast('Error al crear la cotización', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Nueva cotización</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Cliente + fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Cliente (opcional)</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls}>
                <option value="">Sin cliente</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Válida hasta</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Condiciones, observaciones..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Ítems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[--text-secondary]">Ítems</label>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs text-[--nexus-500] hover:underline"
              >
                <Plus size={12} /> Agregar ítem
              </button>
            </div>

            <div className="border border-[--border] rounded-[--radius-md] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[--bg-secondary] text-[--text-tertiary]">
                    <th className="px-3 py-2 text-left font-medium">Descripción</th>
                    <th className="px-3 py-2 text-right font-medium w-16">Cant.</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Precio unit.</th>
                    <th className="px-3 py-2 text-right font-medium w-20">Desc. %</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {items.map((item, idx) => (
                    <tr key={idx} className="bg-[--bg-primary]">
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          placeholder="Descripción del producto o servicio"
                          className="w-full bg-transparent border-0 outline-none text-[--text-primary] text-xs placeholder:text-[--text-tertiary]"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-transparent border-0 outline-none text-right text-[--text-primary] text-xs"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full bg-transparent border-0 outline-none text-right text-[--text-primary] text-xs"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                          className="w-full bg-transparent border-0 outline-none text-right text-[--text-primary] text-xs"
                        />
                      </td>
                      <td className="px-3 py-1 text-right font-semibold text-[--text-primary] tabular-nums whitespace-nowrap">
                        {fmt(itemTotal(item))}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="text-[--text-tertiary] hover:text-red-500 disabled:opacity-30"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="bg-[--bg-secondary] rounded-[--radius-md] p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-[--text-secondary]">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuentos</span>
                <span className="tabular-nums">-{fmt(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-[--text-secondary]">
              <span>IVA (19%)</span>
              <span className="tabular-nums">{fmt(taxTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[--text-primary] border-t border-[--border] pt-2 mt-2">
              <span>TOTAL</span>
              <span className="tabular-nums">{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Crear cotización
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────

function DetailModal({
  quote,
  onClose,
  onConverted,
}: {
  quote: Quote;
  onClose: () => void;
  onConverted: () => void;
}) {
  const [converting, setConverting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const badge = STATUS_BADGE[quote.status] ?? STATUS_BADGE.draft;

  const handleConvert = async () => {
    setConverting(true);
    try {
      await quotesApi.convert(quote.id);
      toast('Cotización convertida a venta', 'success');
      onConverted();
      router.push('/pos');
    } catch {
      toast('Error al convertir la cotización', 'error');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <div>
            <h3 className="font-semibold text-[--text-primary]">Cotización #{quote.id.slice(0, 8)}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-[--text-tertiary] mb-0.5">Cliente</p>
              <p className="text-[--text-primary] font-medium">{quote.customerName ?? 'Sin cliente'}</p>
            </div>
            <div>
              <p className="text-xs text-[--text-tertiary] mb-0.5">Válida hasta</p>
              <p className="text-[--text-primary] font-medium">{fmtDate(quote.validUntil)}</p>
            </div>
            {quote.notes && (
              <div className="col-span-2">
                <p className="text-xs text-[--text-tertiary] mb-0.5">Notas</p>
                <p className="text-[--text-secondary]">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border border-[--border] rounded-[--radius-md] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[--bg-secondary] text-[--text-tertiary]">
                  <th className="px-3 py-2 text-left font-medium">Descripción</th>
                  <th className="px-3 py-2 text-right font-medium">Cant.</th>
                  <th className="px-3 py-2 text-right font-medium">Precio</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {(quote.items ?? []).map((item, idx) => (
                  <tr key={idx} className="bg-[--bg-primary]">
                    <td className="px-3 py-2 text-[--text-primary]">{item.description}</td>
                    <td className="px-3 py-2 text-right text-[--text-secondary]">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-[--text-secondary] tabular-nums">{fmt(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[--text-primary] tabular-nums">
                      {fmt(item.quantity * item.unitPrice * (1 - (item.discount ?? 0) / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-[--bg-secondary] rounded-[--radius-md] p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-[--text-secondary]">
              <span>Subtotal</span><span className="tabular-nums">{fmt(quote.subtotal ?? 0)}</span>
            </div>
            {(quote.discountTotal ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuentos</span><span className="tabular-nums">-{fmt(quote.discountTotal ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-[--text-secondary]">
              <span>Impuestos</span><span className="tabular-nums">{fmt(quote.taxTotal ?? 0)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[--text-primary] border-t border-[--border] pt-2 mt-2">
              <span>TOTAL</span><span className="tabular-nums">{fmt(quote.total ?? 0)}</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">
            Cerrar
          </button>
          {quote.status === 'accepted' && (
            <button
              onClick={() => void handleConvert()}
              disabled={converting}
              className="px-4 py-2 bg-green-600 text-white rounded-[--radius-md] text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {converting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
              Convertir a venta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Change Status Modal ──────────────────────────────────────

function ChangeStatusModal({
  quote,
  onClose,
  onSaved,
}: {
  quote: Quote;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<Quote['status']>(quote.status);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await quotesApi.updateStatus(quote.id, status);
      toast('Estado actualizado', 'success');
      onSaved();
    } catch {
      toast('Error al actualizar el estado', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Cambiar estado</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
            <label key={s.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-[--radius-md] hover:bg-[--bg-secondary]">
              <input
                type="radio"
                name="status"
                value={s.value}
                checked={status === s.value}
                onChange={() => setStatus(s.value as Quote['status'])}
                className="accent-[--nexus-500]"
              />
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[s.value]?.cls ?? ''}`}>
                {s.label}
              </span>
            </label>
          ))}
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || status === quote.status}
            className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function QuotesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const [statusQuote, setStatusQuote] = useState<Quote | null>(null);

  const queryClient = useQueryClient();

  const { data: branchesRaw } = useQuery({
    queryKey: ['branches'],
    queryFn: () => tenantsApi.getBranches(),
    retry: 1,
  });

  const branches = useMemo(() => {
    const raw = branchesRaw as unknown;
    const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : [];
    return arr.map((b) => ({
      id: String((b as { id?: unknown }).id ?? ''),
      name: String((b as { name?: unknown }).name ?? 'Sucursal'),
    })).filter((b) => b.id);
  }, [branchesRaw]);

  const params: { status?: string; branchId?: string } = {};
  if (statusFilter) params.status = statusFilter;
  if (branchFilter) params.branchId = branchFilter;

  const { data: quotesRaw, isLoading } = useQuery({
    queryKey: ['quotes', statusFilter, branchFilter],
    queryFn: () => quotesApi.list(params),
    retry: 1,
  });

  const quotes: Quote[] = useMemo(() => {
    const raw = quotesRaw as unknown;
    const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : [];
    return arr as Quote[];
  }, [quotesRaw]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['quotes'] });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Cotizaciones</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">Gestiona propuestas y convierte a ventas</p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus size={16} /> Nueva cotización
        </button>
      </div>

      {/* Filters */}
      <Card variant="default" padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[--text-tertiary] whitespace-nowrap">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {branches.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[--text-tertiary] whitespace-nowrap">Sucursal</label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
              >
                <option value="">Todas</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border] text-left text-xs text-[--text-tertiary]">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Válida hasta</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={6}><Skeleton variant="table-row" /></td>
                  </tr>
                ))
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText size={24} className="mx-auto mb-2 text-[--text-tertiary] opacity-50" />
                    <p className="text-sm text-[--text-tertiary]">No hay cotizaciones</p>
                  </td>
                </tr>
              ) : quotes.map((quote) => {
                const badge = STATUS_BADGE[quote.status] ?? STATUS_BADGE.draft;
                return (
                  <tr key={quote.id} className="hover:bg-[--bg-secondary] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[--text-tertiary]">{quote.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[--text-primary] font-medium">{quote.customerName ?? 'Sin cliente'}</td>
                    <td className="px-4 py-3 text-[--text-primary] font-semibold tabular-nums">{fmt(quote.total ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[--text-secondary]">{fmtDate(quote.validUntil)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailQuote(quote)}
                          title="Ver detalle"
                          className="p-1.5 rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setStatusQuote(quote)}
                          title="Cambiar estado"
                          className="p-1.5 rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary] hover:text-[--text-primary] transition-colors"
                        >
                          <RefreshCw size={14} />
                        </button>
                        {quote.status === 'accepted' && (
                          <button
                            onClick={() => setDetailQuote(quote)}
                            title="Convertir a venta"
                            className="p-1.5 rounded-[--radius-sm] hover:bg-green-50 text-green-600 transition-colors"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && quotes.length > 0 && (
          <div className="px-4 py-3 border-t border-[--border] text-xs text-[--text-tertiary]">
            {quotes.length} cotización{quotes.length !== 1 ? 'es' : ''}
          </div>
        )}
      </Card>

      {newOpen && (
        <NewQuoteModal
          onClose={() => setNewOpen(false)}
          onSave={() => { setNewOpen(false); invalidate(); }}
        />
      )}
      {detailQuote && (
        <DetailModal
          quote={detailQuote}
          onClose={() => setDetailQuote(null)}
          onConverted={() => { setDetailQuote(null); invalidate(); }}
        />
      )}
      {statusQuote && (
        <ChangeStatusModal
          quote={statusQuote}
          onClose={() => setStatusQuote(null)}
          onSaved={() => { setStatusQuote(null); invalidate(); }}
        />
      )}
    </div>
  );
}
