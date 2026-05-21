'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Receipt, Plus, Search, TrendingDown, Calendar, X, Loader2, Filter,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { expensesApi, tenantsApi } from '../../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface Expense {
  id: string;
  branchId: string;
  category: string;
  amount: number;
  description?: string | null;
  receiptUrl?: string | null;
  createdBy: string;
  createdAt: string;
}

interface CategoryTotal {
  category: string;
  amount: number;
}

interface Summary {
  total: number;
  count: number;
  byCategory: CategoryTotal[];
  expenses: Expense[];
}

// ─── Constants ────────────────────────────────────────────────

const CATEGORIES = [
  'Arriendo',
  'Servicios públicos',
  'Nómina',
  'Transporte',
  'Papelería',
  'Aseo y cafetería',
  'Mantenimiento',
  'Marketing',
  'Impuestos',
  'Bancario',
  'Otro',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Arriendo': 'bg-purple-500',
  'Servicios públicos': 'bg-blue-500',
  'Nómina': 'bg-green-500',
  'Transporte': 'bg-yellow-500',
  'Papelería': 'bg-orange-400',
  'Aseo y cafetería': 'bg-teal-500',
  'Mantenimiento': 'bg-gray-500',
  'Marketing': 'bg-pink-500',
  'Impuestos': 'bg-red-500',
  'Bancario': 'bg-indigo-500',
  'Otro': 'bg-slate-400',
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-slate-400';
}

function fmt(n: number) {
  return `$${Number(n).toLocaleString('es-CO')}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ─── NewExpenseModal ──────────────────────────────────────────

function NewExpenseModal({
  branchId,
  onClose,
  onSave,
}: {
  branchId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await expensesApi.createExpense({
        branchId: branchId || undefined,
        category,
        amount: Number(amount),
        description: description || undefined,
      });
      toast('Gasto registrado', 'success');
      onSave();
    } catch {
      toast('Error al registrar el gasto', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Registrar gasto</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Monto (COP) *</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
              placeholder="Factura luz, gasolina, etc."
            />
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!amount || Number(amount) <= 0 || saving}
            className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real branchId
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => tenantsApi.getBranches(),
    retry: 1,
  });

  const branchId: string = (() => {
    const raw = branchesData as unknown;
    const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : [];
    return (arr[0] as { id?: string })?.id ?? '';
  })();

  // Summary query (drives KPIs + chart)
  const summaryParams: Record<string, string> = { from, to };
  if (branchId) summaryParams.branchId = branchId;

  const { data: summaryRaw, isLoading: loadingSummary } = useQuery({
    queryKey: ['expenses-summary', from, to, branchId],
    queryFn: () => expensesApi.getSummary(summaryParams),
    retry: 1,
    onError: () => toast('No se pudo cargar el resumen de gastos', 'error'),
  } as Parameters<typeof useQuery>[0]);

  const summary: Summary = (() => {
    const raw = summaryRaw as unknown;
    if (raw && typeof raw === 'object' && 'total' in (raw as object)) return raw as Summary;
    return { total: 0, count: 0, byCategory: [], expenses: [] };
  })();

  const expenses = summary.expenses ?? [];

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = !search ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [expenses, search, categoryFilter]);

  const maxCategoryAmount = Math.max(...summary.byCategory.map((c) => c.amount), 1);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Gastos</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">Control de gastos operativos y hormiga</p>
        </div>
        <button
          onClick={() => setNewExpenseOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus size={16} /> Registrar gasto
        </button>
      </div>

      {/* Date range filter */}
      <Card variant="default" padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={15} className="text-[--text-tertiary] flex-shrink-0" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-[--text-tertiary]">Desde</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-[--border] rounded-[--radius-md] px-2 py-1.5 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[--text-tertiary]">Hasta</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-[--border] rounded-[--border] px-2 py-1.5 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            />
          </div>
          <button
            onClick={() => { setFrom(firstOfMonth()); setTo(today()); }}
            className="text-xs text-[--nexus-500] hover:underline ml-auto"
          >
            Este mes
          </button>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={18} className="text-red-600" />
          </span>
          <div>
            {loadingSummary ? <Skeleton variant="text" lines={1} /> : (
              <>
                <p className="text-xl font-bold text-[--text-primary]">{fmt(summary.total)}</p>
                <p className="text-xs text-[--text-secondary]">Total gastos</p>
              </>
            )}
          </div>
        </Card>
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Receipt size={18} className="text-blue-600" />
          </span>
          <div>
            {loadingSummary ? <Skeleton variant="text" lines={1} /> : (
              <>
                <p className="text-xl font-bold text-[--text-primary]">{summary.count}</p>
                <p className="text-xs text-[--text-secondary]">Registros</p>
              </>
            )}
          </div>
        </Card>
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-orange-600" />
          </span>
          <div>
            {loadingSummary ? <Skeleton variant="text" lines={1} /> : (
              <>
                <p className="text-xl font-bold text-[--text-primary]">
                  {summary.count > 0 ? fmt(Math.round(summary.total / summary.count)) : '$0'}
                </p>
                <p className="text-xs text-[--text-secondary]">Promedio por gasto</p>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Split layout */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Category breakdown chart */}
        <Card variant="default" padding="lg">
          <h2 className="text-sm font-semibold text-[--text-primary] mb-4">Por categoría</h2>
          {loadingSummary ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="text" lines={1} />)}
            </div>
          ) : summary.byCategory.length === 0 ? (
            <p className="text-xs text-[--text-tertiary] text-center py-6">Sin datos en el período</p>
          ) : (
            <div className="space-y-3">
              {[...summary.byCategory]
                .sort((a, b) => b.amount - a.amount)
                .map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setCategoryFilter(categoryFilter === cat.category ? '' : cat.category)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium transition-colors ${categoryFilter === cat.category ? 'text-[--nexus-500]' : 'text-[--text-secondary] group-hover:text-[--text-primary]'}`}>
                        {cat.category}
                      </span>
                      <span className="text-xs font-semibold text-[--text-primary] tabular-nums">{fmt(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[--bg-tertiary] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getCategoryColor(cat.category)}`}
                        style={{ width: `${Math.round((cat.amount / maxCategoryAmount) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-[--text-tertiary] mt-0.5">
                      {summary.total > 0 ? Math.round((cat.amount / summary.total) * 100) : 0}% del total
                    </div>
                  </button>
                ))}
            </div>
          )}
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter('')}
              className="mt-4 w-full text-xs text-[--nexus-500] hover:underline flex items-center justify-center gap-1"
            >
              <X size={12} /> Quitar filtro
            </button>
          )}
        </Card>

        {/* Expense list */}
        <Card variant="default" padding="none">
          <div className="p-4 border-b border-[--border]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar descripción o categoría..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[520px]">
            {loadingSummary ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="text" lines={2} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-[--text-tertiary] text-sm">
                <Receipt size={24} className="mx-auto mb-2 opacity-50" />
                {search || categoryFilter ? 'Sin resultados con estos filtros' : 'No hay gastos en este período'}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[--border] text-left text-xs text-[--text-tertiary]">
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {filtered.map((expense) => (
                    <tr key={expense.id} className="hover:bg-[--bg-secondary] transition-colors">
                      <td className="px-4 py-3 text-[--text-tertiary] text-xs tabular-nums whitespace-nowrap">
                        {new Date(expense.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getCategoryColor(expense.category)}`} />
                          <Badge variant="neutral">{expense.category}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[--text-secondary]">
                        {expense.description ?? <span className="text-[--text-tertiary] italic">Sin descripción</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[--danger] tabular-nums">
                        {fmt(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loadingSummary && filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-[--border] flex items-center justify-between text-xs text-[--text-tertiary]">
              <span>{filtered.length} gasto{filtered.length !== 1 ? 's' : ''}{categoryFilter ? ` · ${categoryFilter}` : ''}</span>
              <span className="font-semibold text-[--text-primary]">
                {fmt(filtered.reduce((s, e) => s + Number(e.amount), 0))}
              </span>
            </div>
          )}
        </Card>
      </div>

      {newExpenseOpen && (
        <NewExpenseModal
          branchId={branchId}
          onClose={() => setNewExpenseOpen(false)}
          onSave={() => {
            setNewExpenseOpen(false);
            invalidate();
          }}
        />
      )}
    </div>
  );
}
