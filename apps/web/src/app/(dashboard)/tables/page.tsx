'use client';

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Grid3X3, Plus, X, Loader2, Users } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { tablesApi, tenantsApi } from '../../../lib/api';

// ─── Types ────────────────────────────────────────────────────

type TableStatus = 'available' | 'occupied' | 'reserved';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  notes?: string | null;
  branchId?: string | null;
  activeOrderTotal?: number | null;
}

interface Branch {
  id: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────

const STATUS_CONFIG: Record<TableStatus, { label: string; bg: string; border: string; dot: string }> = {
  available: {
    label: 'Disponible',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-700',
    dot: 'bg-green-500',
  },
  occupied: {
    label: 'Ocupada',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    dot: 'bg-red-500',
  },
  reserved: {
    label: 'Reservada',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-700',
    dot: 'bg-yellow-500',
  },
};

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

// ─── Table Card ───────────────────────────────────────────────

function TableCard({
  table,
  onStatusChange,
  loading,
}: {
  table: Table;
  onStatusChange: (id: string, status: TableStatus | 'release') => void;
  loading: boolean;
}) {
  const cfg = STATUS_CONFIG[table.status];

  return (
    <div
      className={`relative rounded-[--radius-lg] border-2 p-4 flex flex-col gap-3 transition-all ${cfg.bg} ${cfg.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-[--text-primary]">Mesa {table.number}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Users size={12} className="text-[--text-tertiary]" />
            <span className="text-xs text-[--text-tertiary]">{table.capacity} persona{table.capacity !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-[--text-secondary]">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Active order total (if occupied) */}
      {table.status === 'occupied' && table.activeOrderTotal != null && (
        <div className="text-sm font-semibold text-[--text-primary] tabular-nums">
          Cuenta: {fmt(table.activeOrderTotal)}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {table.status === 'available' && (
          <>
            <button
              onClick={() => onStatusChange(table.id, 'occupied')}
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-[--radius-md] bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Ocupar
            </button>
            <button
              onClick={() => onStatusChange(table.id, 'reserved')}
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-[--radius-md] bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 transition-colors dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
            >
              Reservar
            </button>
          </>
        )}
        {table.status === 'occupied' && (
          <button
            onClick={() => onStatusChange(table.id, 'release')}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-[--radius-md] bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
          >
            Liberar
          </button>
        )}
        {table.status === 'reserved' && (
          <>
            <button
              onClick={() => onStatusChange(table.id, 'occupied')}
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-[--radius-md] bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Ocupar
            </button>
            <button
              onClick={() => onStatusChange(table.id, 'release')}
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-[--radius-md] bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            >
              Liberar
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/30 rounded-[--radius-lg]">
          <Loader2 size={20} className="animate-spin text-[--nexus-500]" />
        </div>
      )}
    </div>
  );
}

// ─── New Table Modal ──────────────────────────────────────────

function NewTableModal({
  branches,
  onClose,
  onSave,
}: {
  branches: Branch[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [notes, setNotes] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!number || Number(number) < 1) {
      toast('Ingresa un número de mesa válido', 'error');
      return;
    }
    setSaving(true);
    try {
      await tablesApi.create({
        number: Number(number),
        capacity: Number(capacity) || 4,
        notes: notes || undefined,
        branchId: branchId || undefined,
      });
      toast('Mesa creada', 'success');
      onSave();
    } catch {
      toast('Error al crear la mesa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Nueva mesa</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Número de mesa *</label>
              <input
                type="number"
                min="1"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                autoFocus
                placeholder="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Capacidad</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="4"
                className={inputCls}
              />
            </div>
          </div>
          {branches.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Sucursal</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputCls}>
                <option value="">Sin sucursal</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Junto a la ventana, terraza..."
              className={inputCls}
            />
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !number}
            className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Crear mesa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function TablesPage() {
  const [branchFilter, setBranchFilter] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: branchesRaw } = useQuery({
    queryKey: ['branches'],
    queryFn: () => tenantsApi.getBranches(),
    retry: 1,
  });

  const branches: Branch[] = useMemo(() => {
    const raw = branchesRaw as unknown;
    const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : [];
    return arr.map((b) => ({
      id: String((b as { id?: unknown }).id ?? ''),
      name: String((b as { name?: unknown }).name ?? 'Sucursal'),
    })).filter((b) => b.id);
  }, [branchesRaw]);

  const { data: tablesRaw, isLoading } = useQuery({
    queryKey: ['tables', branchFilter],
    queryFn: () => tablesApi.list(branchFilter || undefined),
    retry: 1,
  });

  const tables: Table[] = useMemo(() => {
    const raw = tablesRaw as unknown;
    const arr = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : [];
    return (arr as Table[]).sort((a, b) => a.number - b.number);
  }, [tablesRaw]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['tables'] });

  const handleStatusChange = async (id: string, action: TableStatus | 'release') => {
    setLoadingIds((prev) => new Set(Array.from(prev).concat(id)));
    try {
      if (action === 'release') {
        await tablesApi.release(id);
        toast('Mesa liberada', 'success');
      } else {
        await tablesApi.updateStatus(id, action);
        const labels: Record<string, string> = { occupied: 'ocupada', reserved: 'reservada' };
        toast(`Mesa marcada como ${labels[action] ?? action}`, 'success');
      }
      invalidate();
    } catch {
      toast('Error al actualizar la mesa', 'error');
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Summary counts
  const available = tables.filter((t) => t.status === 'available').length;
  const occupied = tables.filter((t) => t.status === 'occupied').length;
  const reserved = tables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Mesas</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">Vista de plano del salón</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {branches.length > 1 && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            >
              <option value="">Todas las sucursales</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus size={16} /> Nueva mesa
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Disponibles', count: available, dot: 'bg-green-500' },
          { label: 'Ocupadas', count: occupied, dot: 'bg-red-500' },
          { label: 'Reservadas', count: reserved, dot: 'bg-yellow-500' },
        ].map(({ label, count, dot }) => (
          <Card key={label} variant="default" padding="md" className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
            <div>
              <p className="text-xl font-bold text-[--text-primary]">{count}</p>
              <p className="text-xs text-[--text-secondary]">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="default" padding="md">
              <Skeleton variant="text" lines={3} />
            </Card>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card variant="default" padding="lg">
          <div className="text-center py-8">
            <Grid3X3 size={32} className="mx-auto mb-3 text-[--text-tertiary] opacity-40" />
            <p className="text-sm text-[--text-tertiary]">No hay mesas configuradas</p>
            <p className="text-xs text-[--text-tertiary] mt-1">Crea tu primera mesa para comenzar</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onStatusChange={(id, action) => void handleStatusChange(id, action)}
              loading={loadingIds.has(table.id)}
            />
          ))}
        </div>
      )}

      {newOpen && (
        <NewTableModal
          branches={branches}
          onClose={() => setNewOpen(false)}
          onSave={() => { setNewOpen(false); invalidate(); }}
        />
      )}
    </div>
  );
}
