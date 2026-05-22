'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Package, AlertTriangle, TrendingDown, Plus, ArrowUpDown, Download, Upload, Loader2, Pencil } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { inventoryApi, tenantsApi, api } from '../../../lib/api';
import { cn } from '../../../lib/cn';
import { ImageUpload } from '../../../components/ui/ImageUpload';

interface Product {
  id: string;
  productId: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  cpp: number;
  price: number;
  imageUrl?: string | null;
}

type SortField = 'name' | 'stock' | 'cpp' | 'price';

function getStockBadge(stock: number, minStock: number) {
  if (stock === 0) return <Badge variant="danger" dot>Sin stock</Badge>;
  if (stock < minStock) return <Badge variant="warning" dot>Stock bajo</Badge>;
  return <Badge variant="success">Normal</Badge>;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason?: string | null;
  referenceType?: string | null;
  createdBy: string;
  createdAt: string;
}

interface KardexPage {
  variant: { id: string; sku: string; currentStock: number };
  data: StockMovement[];
  nextCursor: string | null;
  hasMore: boolean;
}

const MOVEMENT_LABELS: Record<string, { label: string; incoming: boolean }> = {
  purchase:      { label: 'Compra',          incoming: true  },
  adjustment:    { label: 'Ajuste',           incoming: false },
  transfer_in:   { label: 'Traslado entrada', incoming: true  },
  transfer_out:  { label: 'Traslado salida',  incoming: false },
  sale:          { label: 'Venta',            incoming: false },
};

function movementMeta(type: string, qty: number) {
  const meta = MOVEMENT_LABELS[type];
  if (meta) return meta;
  return { label: type, incoming: qty > 0 };
}

function KardexModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<KardexPage>({
      queryKey: ['kardex', product.id],
      queryFn: ({ pageParam }) =>
        inventoryApi.getKardex(
          product.id,
          pageParam ? { cursor: pageParam as string } : undefined,
        ) as Promise<KardexPage>,
      getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined,
      initialPageParam: undefined,
    });

  const movements = data?.pages.flatMap((p) => p.data) ?? [];
  const variantInfo = data?.pages[0]?.variant;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-2xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[--border] flex-shrink-0">
          <div>
            <h3 className="font-semibold text-[--text-primary]">Kardex — {product.name}</h3>
            <p className="text-xs text-[--text-tertiary] mt-0.5">
              SKU: {product.sku}
              {variantInfo && (
                <span className="ml-3">Stock actual: <strong className="text-[--text-primary]">{variantInfo.currentStock}</strong></span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]" aria-label="Cerrar">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-[--text-tertiary] text-sm">
              <Loader2 size={16} className="animate-spin" /> Cargando movimientos...
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-[--danger]">No se pudo cargar el kardex</div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center text-sm text-[--text-tertiary]">Sin movimientos registrados</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[--bg-primary] z-10">
                <tr className="text-left text-[--text-tertiary] text-xs border-b border-[--border]">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium text-right">Delta</th>
                  <th className="px-4 py-3 font-medium text-right">Antes</th>
                  <th className="px-4 py-3 font-medium text-right">Después</th>
                  <th className="px-4 py-3 font-medium">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border]">
                {movements.map((m) => {
                  const { label, incoming } = movementMeta(m.type, m.quantity);
                  const isAdjust = m.type === 'adjustment';
                  const effectiveIncoming = isAdjust ? m.quantity > 0 : incoming;
                  return (
                    <tr key={m.id} className="hover:bg-[--bg-secondary] transition-colors">
                      <td className="px-4 py-2.5 text-[--text-secondary] text-xs tabular-nums whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="block text-[--text-tertiary]">
                          {new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium ${effectiveIncoming ? 'text-[--success]' : 'text-[--danger]'}`}>
                          {label}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${m.quantity > 0 ? 'text-[--success]' : 'text-[--danger]'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[--text-tertiary] tabular-nums">{m.previousQty}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-[--text-primary] tabular-nums">{m.newQty}</td>
                      <td className="px-4 py-2.5 text-xs text-[--text-tertiary] max-w-[160px] truncate" title={m.reason ?? ''}>
                        {m.reason ?? m.referenceType ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[--border] flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-[--text-tertiary]">
            {movements.length} movimiento{movements.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {hasNextPage && (
              <button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-3 py-1.5 border border-[--border] text-[--text-secondary] rounded-[--radius-md] text-xs font-medium hover:bg-[--bg-tertiary] disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isFetchingNextPage && <Loader2 size={12} className="animate-spin" />}
                Cargar más
              </button>
            )}
            <button onClick={onClose} className="px-4 py-1.5 bg-[--bg-tertiary] text-[--text-primary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewProductModal({ onClose, onSave, branchId }: { onClose: () => void; onSave: () => void; branchId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Array<{ sku: string; name: string; unitPrice: string; minStock: string }>>([
    { sku: '', name: '', unitPrice: '', minStock: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const upsertVariant = (index: number, key: 'sku' | 'name' | 'unitPrice' | 'minStock', value: string) => {
    setVariants((prev) => prev.map((variant, currentIndex) => (currentIndex === index ? { ...variant, [key]: value } : variant)));
  };

  const addVariantRow = () => {
    setVariants((prev) => [...prev, { sku: '', name: '', unitPrice: price, minStock: minStock || '0' }]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.length === 1 ? prev : prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSave = async () => {
    if (!name || !sku || !price) return;
    if (Number(initialStock) > 0 && !branchId) {
      toast('No hay sucursal activa para recibir stock inicial', 'error');
      return;
    }
    setSaving(true);
    try {
      const payloadVariants = hasVariants
        ? variants
          .map((variant, index) => ({
            sku: variant.sku || `${sku}-${index + 1}`,
            name: variant.name || `${name} ${index + 1}`,
            unitPrice: Number(variant.unitPrice || price),
            minStock: Number(variant.minStock) || 0,
          }))
          .filter((variant) => Boolean(variant.sku) && Boolean(variant.name))
        : [{
            sku,
            name: 'Default',
            unitPrice: Number(price),
            minStock: Number(minStock) || 0,
          }];

      const created = await api.post('/inventory/products', {
        name,
        sku,
        unitPrice: Number(price),
        imageUrl: imageUrl || undefined,
        hasVariants,
        variants: payloadVariants,
      });
      const variantId = created.data?.variants?.[0]?.id as string | undefined;
      if (variantId && Number(initialStock) > 0 && Number(unitCost) > 0) {
        await api.post('/inventory/stock/receive', {
          variantId,
          branchId,
          quantity: Number(initialStock),
          unitCost: Number(unitCost),
          invoiceNumber: `MANUAL-${Date.now()}`,
        });
      }
      toast('Producto creado exitosamente', 'success');
      await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      onSave();
    } catch {
      toast('Error al crear el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Nuevo producto</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="Nombre del producto" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">SKU *</label>
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="BEB-001" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Precio unitario *</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Imagen</label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[--text-secondary]">
            <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} />
            Crear con variantes
          </label>
          {hasVariants && (
            <div className="space-y-3 rounded-[--radius-md] border border-[--border] bg-[--bg-secondary] p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-[--text-secondary]">Variantes</p>
                <button type="button" onClick={addVariantRow} className="text-xs font-medium text-[--nexus-500] hover:underline">+ Agregar variante</button>
              </div>
              <div className="space-y-3">
                {variants.map((variant, index) => (
                  <div key={index} className="space-y-2 rounded-[--radius-md] border border-[--border] bg-[--bg-primary] p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input value={variant.sku} onChange={(e) => upsertVariant(index, 'sku', e.target.value)} placeholder={`SKU variante ${index + 1}`} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
                      <input value={variant.name} onChange={(e) => upsertVariant(index, 'name', e.target.value)} placeholder={`Nombre variante ${index + 1}`} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={variant.unitPrice} onChange={(e) => upsertVariant(index, 'unitPrice', e.target.value)} placeholder="Precio" type="number" className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
                      <input value={variant.minStock} onChange={(e) => upsertVariant(index, 'minStock', e.target.value)} placeholder="Stock mínimo" type="number" className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
                    </div>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariantRow(index)} className="text-xs font-medium text-[--danger] hover:underline">Eliminar variante</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Costo unitario</label>
            <input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Stock inicial</label>
              <input type="number" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">Stock mínimo</label>
              <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="0" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium">Cancelar</button>
          <button onClick={handleSave} disabled={!name || !sku || !price || saving} className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function ReceiveStockModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (qty: number, cost: number, invoiceNumber: string) => void }) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState(product.cpp.toString());
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const q = parseInt(qty);
    const c = parseInt(cost);
    if (!q || q <= 0 || !c || c <= 0) return;

    setSaving(true);
    try {
      await Promise.resolve(onSave(q, c, invoiceNumber));
      await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Recibir stock — {product.name}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]" aria-label="Cerrar">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Cantidad recibida</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
              placeholder="0"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Costo unitario (COP)</label>
            <input
              type="number"
              min="1"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Factura soporte</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
              placeholder="FV-2026-001"
            />
          </div>
          {qty && cost && (
            <div className="p-3 bg-[--bg-secondary] rounded-[--radius-md] text-xs text-[--text-secondary]">
              <p>CPP nuevo: <strong className="text-[--text-primary]">
                ${Math.round((product.stock * product.cpp + parseInt(qty || '0') * parseInt(cost || '0')) / (product.stock + parseInt(qty || '0') || 1)).toLocaleString('es-CO')}
              </strong></p>
              <p className="mt-0.5">Stock resultante: <strong className="text-[--text-primary]">{product.stock + (parseInt(qty) || 0)}</strong></p>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">Cancelar</button>
          <button onClick={() => void handleSave()} disabled={!qty || !cost || saving} className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors">{saving ? 'Guardando...' : 'Guardar entrada'}</button>
        </div>
      </div>
    </div>
  );
}

function EditProductModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(product.name.split(' — ')[0] ?? product.name);
  const [price, setPrice] = useState(String(product.price));
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name || !price) return;
    setSaving(true);
    try {
      await inventoryApi.updateProduct(product.productId, {
        name,
        unitPrice: Number(price),
        imageUrl: imageUrl || undefined,
      });
      toast('Producto actualizado', 'success');
      await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      onSave();
    } catch {
      toast('Error al actualizar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Editar producto</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Precio unitario *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Imagen</label>
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium hover:bg-[--border] transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={!name || !price || saving} className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [kardexProduct, setKardexProduct] = useState<Product | null>(null);
  const [receiveProduct, setReceiveProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

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

  const { data: productsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => inventoryApi.getProducts(),
    retry: 1,
  });

  React.useEffect(() => {
    if (isError) toast('No se pudo cargar el inventario', 'error');
  }, [isError, toast]);

  const products: Product[] = (() => {
    const raw: unknown[] = Array.isArray((productsData as { data?: unknown[] })?.data)
      ? (productsData as { data: unknown[] }).data
      : Array.isArray(productsData) ? productsData as unknown[] : [];
    if (raw.length === 0) return [];

    const result: Product[] = [];
    for (const p of raw as Array<Record<string, unknown>>) {
      const variants = Array.isArray(p.variants) ? p.variants as Array<Record<string, unknown>> : [];
      if (variants.length > 0) {
        for (const v of variants) {
          result.push({
            id: String(v.id ?? p.id),
            productId: String(p.id),
            name: `${String(p.name)} — ${String(v.name)}`,
            sku: String(v.sku ?? p.sku),
            category: String(p.categoryId ?? 'General'),
            stock: Number(v.stock ?? 0),
            minStock: Number(v.minStock ?? p.minStock ?? 0),
            cpp: Number(v.unitCost ?? p.unitCost ?? 0),
            price: Number(v.unitPrice ?? p.unitPrice ?? 0),
            imageUrl: (p.imageUrl as string | null) ?? null,
          });
        }
      } else {
        result.push({
          id: String(p.id),
          productId: String(p.id),
          name: String(p.name),
          sku: String(p.sku),
          category: String(p.categoryId ?? 'General'),
          stock: Number(p.stock ?? 0),
          minStock: Number(p.minStock ?? 0),
          cpp: Number(p.unitCost ?? 0),
          price: Number(p.unitPrice ?? 0),
          imageUrl: (p.imageUrl as string | null) ?? null,
        });
      }
    }
    return result;
  })();

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map((p: Product) => p.category)))], [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p: Product) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'all' || p.category === category;
      const matchLow = !onlyLowStock || p.stock <= p.minStock;
      return matchSearch && matchCat && matchLow;
    });
    list = [...list].sort((a: Product, b: Product) => {
      const av = a[sortField], bv = b[sortField];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [products, search, category, onlyLowStock, sortField, sortAsc]);

  const lowStock = products.filter((p: Product) => p.stock < p.minStock).length;
  const outOfStock = products.filter((p: Product) => p.stock === 0).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const csvEscape = (value: unknown): string => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const parseCsvRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const exportCsv = () => {
    const header = ['sku', 'name', 'category', 'stock', 'minStock', 'cpp', 'price', 'marginPercent'];
    const dataRows = products.map((product) => {
      const margin = product.price > 0
        ? Math.round(((product.price - product.cpp) / product.price) * 100)
        : 0;
      return [
        product.sku,
        product.name,
        product.category,
        product.stock,
        product.minStock,
        product.cpp,
        product.price,
        margin,
      ].map(csvEscape);
    });

    const csv = [header.map(csvEscape), ...dataRows].map((row) => row.join(',')).join('\n');
    // BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast(`CSV exportado con ${products.length} producto${products.length !== 1 ? 's' : ''}`, 'success');
  };

  const importCsv = async (file: File) => {
    if (!branchId) {
      toast('No hay sucursal activa para recibir stock', 'error');
      return;
    }

    const content = await file.text();
    // Strip BOM if present
    const stripped = content.startsWith('\uFEFF') ? content.slice(1) : content;
    const lines = stripped.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const [, ...rows] = lines;

    if (rows.length === 0) {
      toast('El archivo no contiene filas de datos', 'warning');
      return;
    }

    let imported = 0;
    let failed = 0;

    toast(`Importando ${rows.length} producto${rows.length !== 1 ? 's' : ''}…`, 'info');

    for (const row of rows) {
      const [sku, name, _category, stock, minStock, cpp, price] = parseCsvRow(row);
      if (!sku || !name || !price) { failed++; continue; }

      try {
        const created = await api.post('/inventory/products', {
          name,
          sku,
          unitPrice: Number(price) || 0,
          hasVariants: false,
          variants: [{
            sku,
            name: 'Default',
            unitPrice: Number(price) || 0,
            minStock: Number(minStock) || 0,
          }],
        });

        const variantId = created.data?.variants?.[0]?.id as string | undefined;
        const qty = Number(stock) || 0;
        const cost = Number(cpp) || 0;

        if (variantId && qty > 0) {
          await api.post('/inventory/stock/receive', {
            variantId,
            branchId,
            quantity: qty,
            unitCost: cost > 0 ? cost : 1,
            invoiceNumber: `CSV-${Date.now()}`,
          });
        }

        imported++;
      } catch {
        failed++;
      }
    }

    const msg = failed > 0
      ? `Importación finalizada: ${imported} creados, ${failed} con error`
      : `Importación exitosa: ${imported} producto${imported !== 1 ? 's' : ''} creados`;
    toast(msg, imported > 0 ? 'success' : 'warning');
    await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
    void refetch();
  };

  const handleStockCommit = async (product: Product, newValue: number) => {
    const delta = newValue - product.stock;
    setEditingStockId(null);
    if (delta === 0) return;
    if (!branchId) {
      toast('No hay sucursal activa para ajustar stock', 'error');
      return;
    }
    try {
      await api.patch(`/inventory/variants/${product.id}/stock`, {
        quantity: delta,
        branchId,
      });
      toast('Stock actualizado', 'success');
      await queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast(msg ?? 'No se pudo ajustar el stock', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Inventario</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">{products.length} productos registrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2 border border-[--border] text-[--text-primary] rounded-[--radius-md] text-sm font-medium hover:bg-[--bg-tertiary] transition-colors">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-[--border] text-[--text-primary] rounded-[--radius-md] text-sm font-medium hover:bg-[--bg-tertiary] transition-colors">
            <Upload size={16} /> Importar CSV
          </button>
          <button onClick={() => setNewProductOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
            <Plus size={16} /> Nuevo producto
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importCsv(file);
          event.currentTarget.value = '';
        }}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0"><Package size={18} className="text-blue-600" /></span>
          <div><p className="text-xl font-bold text-[--text-primary]">{products.length}</p><p className="text-xs text-[--text-secondary]">Total productos</p></div>
        </Card>
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0"><AlertTriangle size={18} className="text-yellow-600" /></span>
          <div><p className="text-xl font-bold text-[--text-primary]">{lowStock}</p><p className="text-xs text-[--text-secondary]">Stock bajo</p></div>
        </Card>
        <Card variant="default" padding="md" className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-[--radius-md] bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0"><TrendingDown size={18} className="text-red-600" /></span>
          <div><p className="text-xl font-bold text-[--text-primary]">{outOfStock}</p><p className="text-xs text-[--text-secondary]">Sin stock</p></div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="default" padding="md">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto o SKU..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]"
            />
          </div>
          <div className="flex gap-1 bg-[--bg-tertiary] rounded-[--radius-md] p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 text-sm rounded-[--radius-sm] transition-all ${category === cat ? 'bg-[--bg-primary] shadow-sm font-medium text-[--text-primary]' : 'text-[--text-secondary]'}`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[--text-secondary]">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
            />
            Solo stock bajo
          </label>
        </div>
      </Card>

      {/* Table */}
      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border] text-left text-xs text-[--text-tertiary]">
                <th className="px-4 py-3 font-medium">
                  <button className="flex items-center gap-1 hover:text-[--text-primary]" onClick={() => toggleSort('name')}>
                    Producto <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">
                  <button className="flex items-center gap-1 hover:text-[--text-primary]" onClick={() => toggleSort('stock')}>
                    Stock <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">
                  <button className="flex items-center gap-1 hover:text-[--text-primary] ml-auto" onClick={() => toggleSort('cpp')}>
                    CPP <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  <button className="flex items-center gap-1 hover:text-[--text-primary] ml-auto" onClick={() => toggleSort('price')}>
                    Precio <ArrowUpDown size={12} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-right">Margen</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4">
                      <Skeleton variant="table-row" />
                    </td>
                  </tr>
                ))
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-[--bg-secondary] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[--radius-md] border border-[--border] bg-[--bg-tertiary]">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package size={16} className="text-[--text-tertiary]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[--text-primary]">{product.name}</p>
                          <p className="text-xs text-[--text-tertiary] mt-0.5">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[--text-secondary]">{product.category}</td>
                    <td className="px-4 py-3">
                      {editingStockId === product.id ? (
                        <input
                          type="number"
                          autoFocus
                          value={editingStockValue}
                          onChange={(e) => setEditingStockValue(Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleStockCommit(product, editingStockValue);
                            if (e.key === 'Escape') setEditingStockId(null);
                          }}
                          onBlur={() => void handleStockCommit(product, editingStockValue)}
                          className="w-20 border border-[--nexus-500] rounded-[--radius-sm] px-2 py-1 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none tabular-nums"
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 group">
                            <button
                              onClick={() => { setEditingStockId(product.id); setEditingStockValue(product.stock); }}
                              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                              title="Editar stock"
                            >
                              <span className={`font-semibold tabular-nums ${product.stock === 0 ? 'text-[--danger]' : product.stock < product.minStock ? 'text-[--warning]' : 'text-[--text-primary]'}`}>
                                {product.stock}
                              </span>
                              <Pencil size={11} className="text-[--text-tertiary] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <span className="text-xs text-[--text-tertiary]">/ mín {product.minStock}</span>
                          </div>
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[--bg-tertiary]">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                product.stock === 0
                                  ? 'bg-[--danger]'
                                  : product.stock < product.minStock
                                  ? 'bg-[--warning]'
                                  : 'bg-[--success]',
                              )}
                              style={{
                                width: `${Math.max(6, Math.min(100, product.minStock > 0 ? (product.stock / product.minStock) * 100 : 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStockBadge(product.stock, product.minStock)}</td>
                    <td className="px-4 py-3 text-right text-[--text-secondary] tabular-nums">${product.cpp.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-right font-medium text-[--text-primary] tabular-nums">${product.price.toLocaleString('es-CO')}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                      product.price > 0 && ((product.price - product.cpp) / product.price) < 0.2
                        ? 'text-[--danger]'
                        : product.price > 0 && ((product.price - product.cpp) / product.price) < 0.4
                        ? 'text-[--warning]'
                        : 'text-[--success]'
                    }`}>
                      {product.price > 0 ? Math.round(((product.price - product.cpp) / product.price) * 100) : 0}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditProduct(product)}
                          className="px-2 py-1 text-xs rounded-[--radius-sm] border border-[--border] text-[--text-secondary] hover:border-[--gold-500] hover:text-[--gold-600] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setKardexProduct(product)}
                          className="px-2 py-1 text-xs rounded-[--radius-sm] border border-[--border] text-[--text-secondary] hover:border-[--nexus-500] hover:text-[--nexus-500] transition-colors"
                        >
                          Kardex
                        </button>
                        <button
                          onClick={() => setReceiveProduct(product)}
                          className="px-2 py-1 text-xs rounded-[--radius-sm] bg-[--nexus-500] text-white hover:bg-[#1d4ed8] transition-colors"
                        >
                          Recibir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && (
            <div className="py-12 text-center text-[--text-tertiary] text-sm">No se encontraron productos</div>
          )}
        </div>
      </Card>

      {newProductOpen && <NewProductModal branchId={branchId} onClose={() => setNewProductOpen(false)} onSave={() => { void refetch(); setNewProductOpen(false); }} />}
      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={() => { void refetch(); setEditProduct(null); }} />}
      {kardexProduct && <KardexModal product={kardexProduct} onClose={() => setKardexProduct(null)} />}
      {receiveProduct && (
        <ReceiveStockModal
          product={receiveProduct}
          onClose={() => setReceiveProduct(null)}
          onSave={async (qty, cost, invoiceNumber) => {
            if (!branchId) {
              toast('No hay sucursal activa para recibir stock', 'error');
              return;
            }

            try {
              await api.post('/inventory/stock/receive', {
                variantId: receiveProduct.id,
                branchId,
                quantity: qty,
                unitCost: cost,
                invoiceNumber: invoiceNumber || undefined,
              });
              toast('Stock actualizado', 'success');
              await Promise.all([
                refetch(),
                queryClient.invalidateQueries({ queryKey: ['inventory-products'] }),
              ]);
            } catch {
              toast('No se pudo actualizar el stock', 'error');
            } finally {
              setReceiveProduct(null);
            }
          }}
        />
      )}
    </div>
  );
}
