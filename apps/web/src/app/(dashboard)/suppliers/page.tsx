'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, Search, ShoppingCart, Package, ChevronRight,
  CheckCircle2, Clock, AlertCircle, X, Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { suppliersApi, inventoryApi } from '../../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface Supplier {
  id: string;
  name: string;
  nit?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  paymentTermsDays?: number;
  totalOwed: number;
  isActive: boolean;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  total: number;
  notes?: string | null;
  createdAt: string;
  receivedAt?: string | null;
}

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  unitCost: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  variants: ProductVariant[];
}

// ─── Helpers ──────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  partial: { label: 'Parcial', variant: 'warning' },
  received: { label: 'Recibida', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
};

function fmt(n: number) {
  return `$${n.toLocaleString('es-CO')}`;
}

// ─── NewSupplierModal ─────────────────────────────────────────

function NewSupplierModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await suppliersApi.createSupplier({
        name: name.trim(),
        nit: nit || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        contactPerson: contactPerson || undefined,
        paymentTermsDays: Number(paymentTermsDays) || 30,
      });
      toast('Proveedor creado exitosamente', 'success');
      onSave();
    } catch {
      toast('Error al crear el proveedor', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Nuevo proveedor</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Nombre *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
                className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
                placeholder="Distribuidora Central" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">NIT</label>
              <input type="text" value={nit} onChange={(e) => setNit(e.target.value)}
                className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
                placeholder="900.123.456-7" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Teléfono</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
                placeholder="3001234567" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
                placeholder="contacto@proveedor.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Contacto</label>
              <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
                className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
                placeholder="Nombre del contacto" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Dirección</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
                placeholder="Calle 123 # 45-67, Bogotá" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Plazo de pago (días)</label>
              <input type="number" min="0" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)}
                className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NewPurchaseOrderModal ────────────────────────────────────

interface POItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: string;
  unitCost: string;
}

function NewPurchaseOrderModal({
  supplier,
  products,
  onClose,
  onSave,
}: {
  supplier: Supplier;
  products: Product[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [items, setItems] = useState<POItem[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [variantSearch, setVariantSearch] = useState('');
  const { toast } = useToast();

  const allVariants = useMemo(() => {
    const result: Array<{ variantId: string; productName: string; variantName: string; sku: string; unitCost: number }> = [];
    for (const p of products) {
      for (const v of p.variants) {
        result.push({ variantId: v.id, productName: p.name, variantName: v.name, sku: v.sku, unitCost: Number(v.unitCost) });
      }
    }
    return result;
  }, [products]);

  const filteredVariants = useMemo(() => {
    if (!variantSearch) return allVariants.slice(0, 8);
    const q = variantSearch.toLowerCase();
    return allVariants.filter((v) =>
      v.productName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q) || v.variantName.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [allVariants, variantSearch]);

  const addItem = (variant: typeof allVariants[0]) => {
    if (items.some((i) => i.variantId === variant.variantId)) return;
    setItems((prev) => [
      ...prev,
      {
        variantId: variant.variantId,
        productName: variant.productName,
        variantName: variant.variantName,
        sku: variant.sku,
        quantity: '1',
        unitCost: String(variant.unitCost || ''),
      },
    ]);
    setVariantSearch('');
  };

  const updateItem = (variantId: string, field: 'quantity' | 'unitCost', value: string) => {
    setItems((prev) => prev.map((i) => i.variantId === variantId ? { ...i, [field]: value } : i));
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);

  const handleSave = async () => {
    if (items.length === 0) return;
    const validItems = items.filter((i) => Number(i.quantity) > 0 && Number(i.unitCost) > 0);
    if (validItems.length === 0) return;
    setSaving(true);
    try {
      await suppliersApi.createPurchaseOrder(supplier.id, {
        items: validItems.map((i) => ({
          variantId: i.variantId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        })),
        notes: notes || undefined,
      });
      toast('Orden de compra creada', 'success');
      onSave();
    } catch {
      toast('Error al crear la orden de compra', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border] flex-shrink-0">
          <div>
            <h3 className="font-semibold text-[--text-primary]">Nueva orden de compra</h3>
            <p className="text-xs text-[--text-tertiary] mt-0.5">{supplier.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Product search */}
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Agregar producto</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
              <input
                type="text"
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]"
              />
            </div>
            {(variantSearch || filteredVariants.length > 0) && (
              <div className="mt-1 border border-[--border] rounded-[--radius-md] bg-[--bg-primary] overflow-hidden max-h-44 overflow-y-auto">
                {filteredVariants.map((v) => (
                  <button
                    key={v.variantId}
                    onClick={() => addItem(v)}
                    disabled={items.some((i) => i.variantId === v.variantId)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-[--bg-secondary] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="text-[--text-primary]">{v.productName} <span className="text-[--text-tertiary]">— {v.variantName}</span></span>
                    <span className="text-xs text-[--text-tertiary] ml-2 flex-shrink-0">{v.sku}</span>
                  </button>
                ))}
                {filteredVariants.length === 0 && (
                  <p className="px-3 py-2 text-sm text-[--text-tertiary]">Sin resultados</p>
                )}
              </div>
            )}
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div className="border border-[--border] rounded-[--radius-md] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[--bg-secondary] border-b border-[--border] text-xs text-[--text-tertiary]">
                    <th className="px-3 py-2 text-left font-medium">Producto</th>
                    <th className="px-3 py-2 text-right font-medium w-24">Cantidad</th>
                    <th className="px-3 py-2 text-right font-medium w-32">Costo unit.</th>
                    <th className="px-3 py-2 text-right font-medium w-24">Subtotal</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {items.map((item) => (
                    <tr key={item.variantId}>
                      <td className="px-3 py-2">
                        <p className="text-[--text-primary] font-medium">{item.productName}</p>
                        <p className="text-xs text-[--text-tertiary]">{item.sku}</p>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" value={item.quantity}
                          onChange={(e) => updateItem(item.variantId, 'quantity', e.target.value)}
                          className="w-full text-right border border-[--border] rounded-[--radius-sm] px-2 py-1 text-sm bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={item.unitCost}
                          onChange={(e) => updateItem(item.variantId, 'unitCost', e.target.value)}
                          className="w-full text-right border border-[--border] rounded-[--radius-sm] px-2 py-1 text-sm bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-[--text-primary] tabular-nums">
                        {fmt((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))}
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeItem(item.variantId)}
                          className="w-6 h-6 flex items-center justify-center rounded text-[--text-tertiary] hover:text-[--danger] hover:bg-red-50 transition-colors">
                          <X size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-3 py-2 bg-[--bg-secondary] border-t border-[--border]">
                <span className="text-xs text-[--text-tertiary]">{items.length} producto{items.length !== 1 ? 's' : ''}</span>
                <span className="font-semibold text-[--text-primary]">Total: {fmt(total)}</span>
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="py-8 text-center text-[--text-tertiary] text-sm border border-dashed border-[--border] rounded-[--radius-md]">
              <ShoppingCart size={24} className="mx-auto mb-2 opacity-50" />
              Agrega productos para crear la orden
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500] resize-none"
              placeholder="Instrucciones especiales, referencia interna..." />
          </div>
        </div>

        <div className="p-5 border-t border-[--border] flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={items.length === 0 || saving}
            className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : `Crear OC ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ReceivePurchaseOrderModal ────────────────────────────────

function ReceivePurchaseOrderModal({
  order,
  supplier,
  products,
  onClose,
  onSave,
}: {
  order: PurchaseOrder;
  supplier: Supplier;
  products: Product[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [items, setItems] = useState<Array<{ variantId: string; productName: string; sku: string; quantityReceived: string; actualUnitCost: string }>>([]);
  const [variantSearch, setVariantSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const allVariants = useMemo(() => {
    const result: Array<{ variantId: string; productName: string; variantName: string; sku: string; unitCost: number }> = [];
    for (const p of products) {
      for (const v of p.variants) {
        result.push({ variantId: v.id, productName: p.name, variantName: v.name, sku: v.sku, unitCost: Number(v.unitCost) });
      }
    }
    return result;
  }, [products]);

  const filteredVariants = useMemo(() => {
    if (!variantSearch) return allVariants.slice(0, 8);
    const q = variantSearch.toLowerCase();
    return allVariants.filter((v) =>
      v.productName.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [allVariants, variantSearch]);

  const addItem = (variant: typeof allVariants[0]) => {
    if (items.some((i) => i.variantId === variant.variantId)) return;
    setItems((prev) => [
      ...prev,
      { variantId: variant.variantId, productName: variant.productName, sku: variant.sku, quantityReceived: '1', actualUnitCost: String(variant.unitCost || '') },
    ]);
    setVariantSearch('');
  };

  const update = (variantId: string, field: 'quantityReceived' | 'actualUnitCost', value: string) => {
    setItems((prev) => prev.map((i) => i.variantId === variantId ? { ...i, [field]: value } : i));
  };

  const handleSave = async () => {
    const valid = items.filter((i) => Number(i.quantityReceived) > 0 && Number(i.actualUnitCost) > 0);
    if (valid.length === 0) return;
    setSaving(true);
    try {
      await suppliersApi.receivePurchaseOrder(supplier.id, order.id, {
        items: valid.map((i) => ({
          variantId: i.variantId,
          quantityReceived: Number(i.quantityReceived),
          actualUnitCost: Number(i.actualUnitCost),
        })),
      });
      toast('Orden recibida — stock actualizado', 'success');
      onSave();
    } catch {
      toast('Error al recibir la orden', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border] flex-shrink-0">
          <div>
            <h3 className="font-semibold text-[--text-primary]">Recibir orden de compra</h3>
            <p className="text-xs text-[--text-tertiary] mt-0.5">{supplier.name} · {fmt(order.total)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs text-[--text-secondary] bg-[--bg-secondary] rounded-[--radius-md] p-3">
            Confirma los productos y cantidades realmente recibidos. El stock y CPP se actualizarán automáticamente.
          </p>

          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Agregar producto recibido</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
              <input type="text" value={variantSearch} onChange={(e) => setVariantSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]" />
            </div>
            {(variantSearch || filteredVariants.length > 0) && (
              <div className="mt-1 border border-[--border] rounded-[--radius-md] bg-[--bg-primary] overflow-hidden max-h-40 overflow-y-auto">
                {filteredVariants.map((v) => (
                  <button key={v.variantId} onClick={() => addItem(v)}
                    disabled={items.some((i) => i.variantId === v.variantId)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-[--bg-secondary] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <span className="text-[--text-primary]">{v.productName} <span className="text-[--text-tertiary]">— {v.variantName}</span></span>
                    <span className="text-xs text-[--text-tertiary]">{v.sku}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.variantId} className="border border-[--border] rounded-[--radius-md] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[--text-primary]">{item.productName}</p>
                      <p className="text-xs text-[--text-tertiary]">{item.sku}</p>
                    </div>
                    <button onClick={() => setItems((prev) => prev.filter((i) => i.variantId !== item.variantId))}
                      className="w-6 h-6 flex items-center justify-center rounded text-[--text-tertiary] hover:text-[--danger] hover:bg-red-50 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[--text-tertiary] mb-1">Cantidad recibida</label>
                      <input type="number" min="1" value={item.quantityReceived}
                        onChange={(e) => update(item.variantId, 'quantityReceived', e.target.value)}
                        className="w-full border border-[--border] rounded-[--radius-sm] px-2 py-1.5 text-sm bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[--text-tertiary] mb-1">Costo real (COP)</label>
                      <input type="number" min="0" value={item.actualUnitCost}
                        onChange={(e) => update(item.variantId, 'actualUnitCost', e.target.value)}
                        className="w-full border border-[--border] rounded-[--radius-sm] px-2 py-1.5 text-sm bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <div className="py-6 text-center text-[--text-tertiary] text-sm border border-dashed border-[--border] rounded-[--radius-md]">
              <Package size={20} className="mx-auto mb-2 opacity-50" />
              Agrega los productos que llegaron
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[--border] flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={items.length === 0 || saving}
            className="px-4 py-2 bg-[--success] text-white rounded-[--radius-md] text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Confirmar recepción
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [newPoOpen, setNewPoOpen] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrder | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliersRaw, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getSuppliers(),
    retry: 1,
  });

  const { data: ordersRaw, isLoading: loadingOrders } = useQuery({
    queryKey: ['supplier-orders', selectedSupplier?.id],
    queryFn: () => suppliersApi.getPurchaseOrders(selectedSupplier!.id),
    enabled: !!selectedSupplier,
    retry: 1,
  });

  const { data: productsRaw } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => inventoryApi.getProducts(),
    retry: 1,
  });

  const suppliers: Supplier[] = (() => {
    const raw = suppliersRaw as unknown;
    return (Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : []) as Supplier[];
  })();

  const orders: PurchaseOrder[] = (() => {
    const raw = ordersRaw as unknown;
    return (Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : []) as PurchaseOrder[];
  })();

  const products: Product[] = (() => {
    const raw = productsRaw as unknown;
    return (Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown[] })?.data) ? (raw as { data: unknown[] }).data : []) as Product[];
  })();

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.nit?.toLowerCase().includes(q));
  }, [suppliers, search]);

  const totalOwed = suppliers.reduce((s, sup) => s + (sup.totalOwed ?? 0), 0);
  const activeCount = suppliers.filter((s) => s.isActive).length;
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'partial').length;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    if (selectedSupplier) {
      void queryClient.invalidateQueries({ queryKey: ['supplier-orders', selectedSupplier.id] });
    }
  };

  // Keep selected supplier in sync with fresh data after refetch
  React.useEffect(() => {
    if (!selectedSupplier) return;
    const updated = suppliers.find((s) => s.id === selectedSupplier.id);
    if (updated) setSelectedSupplier(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliersRaw]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Proveedores</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">Gestión de proveedores y órdenes de compra</p>
        </div>
        <button
          onClick={() => setNewSupplierOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-blue-600" />
          </span>
          <div><p className="text-xl font-bold text-[--text-primary]">{activeCount}</p><p className="text-xs text-[--text-secondary]">Proveedores activos</p></div>
        </Card>
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-yellow-600" />
          </span>
          <div>
            <p className="text-xl font-bold text-[--text-primary]">{selectedSupplier ? pendingOrders : '—'}</p>
            <p className="text-xs text-[--text-secondary]">OC pendientes</p>
          </div>
        </Card>
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} className="text-red-600" />
          </span>
          <div><p className="text-xl font-bold text-[--text-primary]">{fmt(totalOwed)}</p><p className="text-xs text-[--text-secondary]">Total por pagar</p></div>
        </Card>
      </div>

      {/* Main split layout */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Suppliers list */}
        <Card variant="default" padding="none">
          <div className="p-4 border-b border-[--border]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar proveedor..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[480px]">
            {loadingSuppliers ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" lines={2} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-[--text-tertiary] text-sm">
                <Building2 size={24} className="mx-auto mb-2 opacity-50" />
                {search ? 'Sin resultados' : 'No hay proveedores aún'}
              </div>
            ) : (
              filtered.map((supplier) => (
                <button
                  key={supplier.id}
                  onClick={() => setSelectedSupplier(supplier)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[--border] last:border-0 transition-colors ${
                    selectedSupplier?.id === supplier.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-[--bg-secondary]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-[--radius-md] bg-[--bg-tertiary] flex items-center justify-center flex-shrink-0 text-sm font-bold text-[--text-secondary]">
                    {supplier.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[--text-primary] truncate">{supplier.name}</p>
                    <p className="text-xs text-[--text-tertiary] truncate">
                      {supplier.nit ?? (supplier.email ?? 'Sin NIT')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {supplier.totalOwed > 0 && (
                      <p className="text-xs font-medium text-[--danger]">{fmt(supplier.totalOwed)}</p>
                    )}
                    <ChevronRight size={14} className="text-[--text-tertiary] ml-auto mt-0.5" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right panel: supplier detail */}
        <Card variant="default" padding="none">
          {!selectedSupplier ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-[--text-tertiary]">
              <Building2 size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Selecciona un proveedor para ver sus órdenes</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Supplier info header */}
              <div className="p-5 border-b border-[--border]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[--text-primary]">{selectedSupplier.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[--text-tertiary]">
                      {selectedSupplier.nit && <span>NIT {selectedSupplier.nit}</span>}
                      {selectedSupplier.phone && <span>{selectedSupplier.phone}</span>}
                      {selectedSupplier.email && <span>{selectedSupplier.email}</span>}
                      {selectedSupplier.contactPerson && <span>Contacto: {selectedSupplier.contactPerson}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectedSupplier.totalOwed > 0 && (
                      <span className="text-xs font-semibold text-[--danger] bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-[--radius-sm]">
                        Por pagar: {fmt(selectedSupplier.totalOwed)}
                      </span>
                    )}
                    <button
                      onClick={() => setNewPoOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                    >
                      <Plus size={14} /> Nueva OC
                    </button>
                  </div>
                </div>
              </div>

              {/* Purchase orders */}
              <div className="flex-1 overflow-y-auto">
                {loadingOrders ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" lines={2} />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center text-[--text-tertiary] text-sm">
                    <ShoppingCart size={24} className="mx-auto mb-2 opacity-50" />
                    <p>Sin órdenes de compra</p>
                    <button onClick={() => setNewPoOpen(true)}
                      className="mt-3 text-[--nexus-500] text-xs hover:underline">
                      Crear primera orden
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[--border]">
                    {orders.map((order) => {
                      const { label, variant } = STATUS_MAP[order.status] ?? { label: order.status, variant: 'neutral' as const };
                      return (
                        <div key={order.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[--bg-secondary] transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[--text-primary] text-sm">{fmt(order.total)}</span>
                              <Badge variant={variant} dot>{label}</Badge>
                            </div>
                            <p className="text-xs text-[--text-tertiary] mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {order.notes && ` · ${order.notes}`}
                            </p>
                          </div>
                          {(order.status === 'pending' || order.status === 'partial') && (
                            <button
                              onClick={() => setReceiveOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[--success] text-[--success] rounded-[--radius-md] text-xs font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                              <CheckCircle2 size={13} /> Recibir
                            </button>
                          )}
                          {order.status === 'received' && (
                            <span className="text-xs text-[--text-tertiary]">
                              {order.receivedAt && new Date(order.receivedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      {newSupplierOpen && (
        <NewSupplierModal
          onClose={() => setNewSupplierOpen(false)}
          onSave={() => {
            setNewSupplierOpen(false);
            void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          }}
        />
      )}

      {newPoOpen && selectedSupplier && (
        <NewPurchaseOrderModal
          supplier={selectedSupplier}
          products={products}
          onClose={() => setNewPoOpen(false)}
          onSave={() => {
            setNewPoOpen(false);
            invalidate();
          }}
        />
      )}

      {receiveOrder && selectedSupplier && (
        <ReceivePurchaseOrderModal
          order={receiveOrder}
          supplier={selectedSupplier}
          products={products}
          onClose={() => setReceiveOrder(null)}
          onSave={() => {
            setReceiveOrder(null);
            invalidate();
            void queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
          }}
        />
      )}
    </div>
  );
}
