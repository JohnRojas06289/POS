'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SearchBar } from '../../../components/pos/SearchBar';
import { ProductCard } from '../../../components/pos/ProductCard';
import { CartItem } from '../../../components/pos/CartItem';
import { PaymentModal } from '../../../components/pos/PaymentModal';
import { BarcodeScannerModal } from '../../../components/pos/BarcodeScannerModal';
import { SkeletonGrid } from '../../../components/ui/Skeleton';
import { CurrencyDisplay } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useOfflineStore } from '../../../stores/offline.store';
import { posApi } from '../../../lib/api';
import { cn } from '../../../lib/cn';
import { v4 as uuidv4 } from 'uuid';

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
}

interface Product {
  id: string;
  name: string;
  imageUrl?: string | null;
  categoryId?: string | null;
  variants: Variant[];
}

interface CartItemState {
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  discountMode?: 'fixed' | 'percent';
  discountValue?: number;
}

const CART_KEY = 'nexus-pos-cart';
const HELD_CART_KEY = 'nexus-pos-held-cart';
const RECEIPTS_KEY = 'nexus-pos-receipts';
const DEFAULT_BRANCH_ID = '00000000-0000-0000-0000-000000000001';

function parseDiscountInput(input: string, baseAmount: number): {
  discountMode: 'fixed' | 'percent';
  discountValue: number;
} | null {
  const raw = input.trim().replace(',', '.');
  if (!raw) return { discountMode: 'fixed', discountValue: 0 };

  if (raw.endsWith('%')) {
    const value = parseFloat(raw.slice(0, -1));
    if (isNaN(value) || value < 0 || value > 100) return null;
    return { discountMode: 'percent', discountValue: value };
  }

  const value = parseFloat(raw);
  if (isNaN(value) || value < 0 || value > baseAmount) return null;
  return { discountMode: 'fixed', discountValue: value };
}

function computeDiscountAmount(item: CartItemState): number {
  const subtotal = item.unitPrice * item.quantity;
  if (!item.discountMode || !item.discountValue) return 0;
  if (item.discountMode === 'percent') {
    return Math.min(subtotal, Math.round((subtotal * item.discountValue) / 100));
  }
  return Math.min(subtotal, item.discountValue);
}

export default function POSPage() {
  const { toast } = useToast();
  const { isOnline, addPendingOrder } = useOfflineStore();
  const queryClient = useQueryClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItemState[]>([]);
  const [cartDiscountMode, setCartDiscountMode] = useState<'fixed' | 'percent' | null>(null);
  const [cartDiscountValue, setCartDiscountValue] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [priceInquiryMode, setPriceInquiryMode] = useState(false);
  const [priceInquiryProduct, setPriceInquiryProduct] = useState<Product | null>(null);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [hasHeldCart, setHasHeldCart] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load products
  useEffect(() => {
    void (async () => {
      try {
        const raw = await posApi.getProducts() as Array<Record<string, unknown>>;
        const mapped: Product[] = raw.map((p) => ({
          id: String(p.id),
          name: String(p.name),
          imageUrl: (p.imageUrl as string | null) ?? null,
          categoryId: (p.categoryId as string | null) ?? null,
          variants: (Array.isArray(p.variants) ? p.variants as Array<Record<string, unknown>> : []).map((v) => ({
            id: String(v.id),
            name: String(v.name),
            price: Number(v.unitPrice ?? v.price ?? 0),
            stock: Number(v.stock ?? 0),
            sku: v.sku ? String(v.sku) : undefined,
          })),
        }));
        setProducts(mapped);
      } catch {
        toast('No se pudieron cargar los productos', 'error');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      const held = localStorage.getItem(HELD_CART_KEY);
      setHasHeldCart(Boolean(held));
      if (saved) {
        const parsed = JSON.parse(saved) as CartItemState[];
        if (parsed.length > 0) {
          setCart(parsed);
          toast(`Recuperamos tu carrito anterior (${parsed.length} item${parsed.length > 1 ? 's' : ''})`, 'info');
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        (window as Window & { posSearchRef?: HTMLInputElement | null }).posSearchRef?.focus();
      }
      if (e.key === 'F2' && cart.length > 0) {
        e.preventDefault();
        setPaymentOpen(true);
      }
      if (e.key === 'F3' && cart.length > 0) {
        e.preventDefault();
        localStorage.setItem(HELD_CART_KEY, JSON.stringify(cart));
        setHasHeldCart(true);
        setCart([]);
        toast('Venta suspendida. Usa “Reanudar” para recuperarla.', 'info');
      }
      if (e.key === 'Escape') {
        setPaymentOpen(false);
        setVariantProduct(null);
        setPriceInquiryProduct(null);
        setBarcodeScannerOpen(false);
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        setCart((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.quantity > 1) return prev.map((i, idx) => idx === prev.length - 1 ? { ...i, quantity: i.quantity - 1 } : i);
          return prev.slice(0, -1);
        });
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [cart, toast]);

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(
        products
          .map((product) => product.categoryId?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    );
    return ['all', ...values];
  }, [products]);

  // Filtered products
  const filtered = useMemo(() => {
    let visible = products;
    if (selectedCategory !== 'all') {
      visible = visible.filter((product) => product.categoryId === selectedCategory);
    }
    if (!search) return visible;
    const q = search.toLowerCase();
    return visible.filter(
      (p) => p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku?.toLowerCase().includes(q)),
    );
  }, [products, search, selectedCategory]);

  const addToCart = useCallback((product: Product, variantIdx: number) => {
    const variant = product.variants[variantIdx];
    if (!variant || variant.stock === 0) return;
    if (priceInquiryMode) {
      setPriceInquiryProduct(product);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          toast(`Solo quedan ${variant.stock} unidades disponibles`, 'warning');
          return prev.map((i) => i.variantId === variant.id ? { ...i, quantity: variant.stock } : i);
        }
        return prev.map((i) => i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        unitPrice: variant.price,
        quantity: 1,
        maxStock: variant.stock,
      }];
    });
  }, [priceInquiryMode, toast]);

  const updateQty = useCallback((variantId: string, qty: number) => {
    setCart((prev) => prev.map((i) => i.variantId === variantId ? { ...i, quantity: qty } : i));
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const applyItemDiscount = useCallback((variantId: string) => {
    const currentItem = cart.find((item) => item.variantId === variantId);
    if (!currentItem) return;

    const subtotal = currentItem.unitPrice * currentItem.quantity;
    const current =
      currentItem.discountMode === 'percent'
        ? `${currentItem.discountValue ?? 0}%`
        : String(currentItem.discountValue ?? 0);
    const input = window.prompt(
      'Descuento del item. Usa "10%" para porcentaje o "5000" para valor fijo. Deja vacío para quitarlo.',
      current,
    );
    if (input === null) return;

    const parsed = parseDiscountInput(input, subtotal);
    if (!parsed) {
      toast('Descuento inválido', 'warning');
      return;
    }

    setCart((prev) => prev.map((item) => item.variantId === variantId
      ? {
          ...item,
          discountMode: parsed.discountValue > 0 ? parsed.discountMode : undefined,
          discountValue: parsed.discountValue > 0 ? parsed.discountValue : undefined,
        }
      : item));
  }, [cart, toast]);

  const handleClear = useCallback(() => {
    if (clearConfirm) {
      setCart([]);
      setCartDiscountMode(null);
      setCartDiscountValue(0);
      setClearConfirm(false);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    } else {
      setClearConfirm(true);
      clearTimer.current = setTimeout(() => setClearConfirm(false), 2000);
    }
  }, [clearConfirm]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart],
  );
  const itemDiscountTotal = useMemo(
    () => cart.reduce((sum, item) => sum + computeDiscountAmount(item), 0),
    [cart],
  );
  const subtotalAfterItemDiscount = Math.max(0, subtotal - itemDiscountTotal);
  const cartDiscountAmount = useMemo(() => {
    if (!cartDiscountMode || cartDiscountValue <= 0) return 0;
    if (cartDiscountMode === 'percent') {
      return Math.min(
        subtotalAfterItemDiscount,
        Math.round((subtotalAfterItemDiscount * cartDiscountValue) / 100),
      );
    }
    return Math.min(subtotalAfterItemDiscount, cartDiscountValue);
  }, [cartDiscountMode, cartDiscountValue, subtotalAfterItemDiscount]);
  const total = useMemo(
    () => Math.max(0, subtotalAfterItemDiscount - cartDiscountAmount),
    [cartDiscountAmount, subtotalAfterItemDiscount],
  );
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const handleConfirmPayment = useCallback(async (payments: Array<{ method: string; amount: number }>) => {
    const localId = uuidv4();
    const receipt = {
      id: localId,
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({
        ...item,
        discountAmount: computeDiscountAmount(item),
      })),
      payments,
      subtotal,
      itemDiscountTotal,
      cartDiscountAmount,
      total,
      mode: isOnline ? 'online' : 'offline',
    };
    const existingReceipts = (() => {
      try {
        const raw = localStorage.getItem(RECEIPTS_KEY);
        return raw ? JSON.parse(raw) as unknown[] : [];
      } catch {
        return [];
      }
    })();
    localStorage.setItem(
      RECEIPTS_KEY,
      JSON.stringify([receipt, ...existingReceipts].slice(0, 50)),
    );

    const payload = {
      localId,
      branchId: DEFAULT_BRANCH_ID,
      items: cart.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: computeDiscountAmount(i),
      })),
      payments,
      discountTotal: cartDiscountAmount,
    };

    if (!isOnline) {
      addPendingOrder(payload);
      localStorage.removeItem(CART_KEY);
      setCart([]);
      setCartDiscountMode(null);
      setCartDiscountValue(0);
      toast('Recibo digital guardado para esta venta offline', 'success');
      return;
    }

    try {
      await posApi.createOrder(payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-sales'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-products'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ]);
    } catch {
      // Fallback: save offline
      addPendingOrder(payload);
    }
    localStorage.removeItem(CART_KEY);
    setCart([]);
    setCartDiscountMode(null);
    setCartDiscountValue(0);
    toast('Recibo digital guardado', 'success');
  }, [addPendingOrder, cart, cartDiscountAmount, isOnline, itemDiscountTotal, subtotal, toast, total]);

  const restoreHeldCart = useCallback(() => {
    try {
      const held = localStorage.getItem(HELD_CART_KEY);
      if (!held) return;
      const parsed = JSON.parse(held) as CartItemState[];
      setCart(parsed);
      localStorage.removeItem(HELD_CART_KEY);
      setHasHeldCart(false);
      toast(`Venta reanudada (${parsed.length} item${parsed.length !== 1 ? 's' : ''})`, 'success');
    } catch {
      toast('No se pudo reanudar la venta suspendida', 'error');
    }
  }, [toast]);

  const applyCartDiscount = useCallback(() => {
    const input = window.prompt(
      'Descuento del carrito. Usa "10%" para porcentaje o "5000" para valor fijo. Deja vacío para quitarlo.',
      cartDiscountMode === 'percent' ? `${cartDiscountValue}%` : String(cartDiscountValue || ''),
    );
    if (input === null) return;
    const parsed = parseDiscountInput(input, subtotalAfterItemDiscount);
    if (!parsed) {
      toast('Descuento inválido', 'warning');
      return;
    }
    setCartDiscountMode(parsed.discountValue > 0 ? parsed.discountMode : null);
    setCartDiscountValue(parsed.discountValue);
  }, [cartDiscountMode, cartDiscountValue, subtotalAfterItemDiscount, toast]);

  return (
    <div className="grid h-full grid-cols-[minmax(0,3fr)_minmax(340px,2fr)] bg-[var(--bg-base)]">
      {/* Left: Catalog */}
      <div className="flex min-w-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-base)]">
        {/* Search */}
        <div className="space-y-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            resultCount={search ? filtered.length : undefined}
            onBarcodeScan={() => setBarcodeScannerOpen(true)}
          />
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1" aria-label="Categorías">
            {categories.map((category) => {
              const active = selectedCategory === category;
              const label = category === 'all' ? 'Todas' : category.replace(/_/g, ' ');
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-all duration-150',
                    active
                      ? 'border-[var(--gold-500)] bg-[var(--gold-500)] text-[#1A1400]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-gold)] hover:text-[var(--text-primary)]',
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => setPriceInquiryMode((prev) => !prev)}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-all duration-150',
                priceInquiryMode
                  ? 'border-[var(--text-gold)] bg-[rgba(201,168,76,0.12)] text-[var(--text-gold)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-gold)] hover:text-[var(--text-primary)]',
              )}
              aria-pressed={priceInquiryMode}
            >
              Consulta de precios
            </button>
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <SkeletonGrid count={12} />
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="mb-3 text-5xl" aria-hidden>🔍</span>
              <p className="font-medium text-[var(--text-secondary)]">Sin resultados</p>
              <p className="text-sm text-[var(--text-tertiary)]">Intenta con otro término</p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
              aria-label="Catálogo de productos"
            >
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  onSelectVariant={(p) => (priceInquiryMode ? setPriceInquiryProduct(p) : setVariantProduct(p))}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex min-w-[340px] flex-col bg-[var(--bg-surface)]">
        {/* Cart header */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] p-3">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-medium text-[var(--text-primary)]">
            Carrito
            {itemCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-[rgba(201,168,76,0.12)] px-2 py-0.5 text-xs font-semibold text-[var(--text-gold)]">{itemCount}</span>
            )}
          </h2>
          {cart.length > 0 && (
            <button
              onClick={handleClear}
              className={cn(
                'rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium transition-all duration-150',
                clearConfirm
                  ? 'border border-[var(--danger-text)] bg-[var(--danger-bg)] text-[var(--danger-text)]'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--danger-text)]',
              )}
              aria-label="Limpiar carrito"
            >
              {clearConfirm ? '¿Seguro?' : 'Limpiar'}
            </button>
          )}
        </div>

        {hasHeldCart && (
          <div className="px-3 pt-3">
            <button
              onClick={restoreHeldCart}
              className="w-full rounded-[var(--radius-md)] border border-[var(--gold-500)] px-3 py-2 text-sm font-medium text-[var(--text-gold)] hover:bg-[rgba(201,168,76,0.08)]"
            >
              Reanudar venta suspendida (F3)
            </button>
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3" aria-label="Items en el carrito">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <span className="mb-2 text-4xl" aria-hidden>🛒</span>
              <p className="text-sm text-[var(--text-tertiary)]">El carrito está vacío</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Click en un producto para agregar</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem
                key={item.variantId}
                item={{
                  ...item,
                  discountAmount: computeDiscountAmount(item),
                }}
                onQtyChange={updateQty}
                onRemove={removeItem}
                onApplyDiscount={applyItemDiscount}
              />
            ))
          )}
        </div>

        {/* Totals + actions */}
        <div className="space-y-3 border-t border-[var(--border-default)] p-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>{itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            {itemDiscountTotal > 0 && (
              <div className="flex justify-between text-sm text-[var(--success-text)]">
                <span>Descuento por ítems</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-${itemDiscountTotal.toLocaleString('es-CO')}</span>
              </div>
            )}
            <button
              onClick={applyCartDiscount}
              className="flex w-full items-center justify-between text-sm text-[var(--text-secondary)] hover:text-[var(--text-gold)]"
            >
              <span>Descuento carrito</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {cartDiscountAmount > 0 ? `-${cartDiscountAmount.toLocaleString('es-CO')}` : 'Agregar'}
              </span>
            </button>
            <div className="flex items-end justify-between border-t border-[var(--border-default)] pt-2">
              <span style={{ fontFamily: 'var(--font-display)' }} className="text-base font-medium text-[var(--text-primary)]">TOTAL</span>
              <CurrencyDisplay amount={total} size="lg" gold />
            </div>
          </div>

          {!isOnline && cart.length > 0 && (
            <div className="rounded-[var(--radius-sm)] bg-[var(--warning-bg)] px-2 py-1.5 text-xs text-[var(--warning-text)]">
              ⚠ Sin conexión — la venta se sincronizará al reconectar
            </div>
          )}

          <button
            onClick={() => setPaymentOpen(true)}
            disabled={cart.length === 0}
            aria-disabled={cart.length === 0}
            title={cart.length === 0 ? 'Agrega productos al carrito' : `Cobrar $${total.toLocaleString('es-CO')} (F2)`}
              className={cn('h-12 w-full rounded-[var(--radius-md)] text-base font-bold transition-all duration-150', cart.length > 0 ? 'bg-[var(--gold-500)] text-[#1A1400] shadow-[var(--shadow-sm)] hover:bg-[var(--gold-400)] active:scale-[0.99]' : 'cursor-not-allowed bg-[var(--bg-subtle)] text-[var(--text-tertiary)]')}
            >
              {cart.length > 0 ? `Cobrar $${total.toLocaleString('es-CO')}` : 'Cobrar'}
            </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        cart={cart}
        hasCustomer={false}
        onConfirm={handleConfirmPayment}
      />

      {/* Variant Selector (simple inline modal) */}
      {variantProduct && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label={`Variantes de ${variantProduct.name}`}
          onClick={(e) => { if (e.target === e.currentTarget) setVariantProduct(null); }}
        >
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6 w-full max-w-sm border border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[var(--text-primary)]">{variantProduct.name}</h3>
              <button onClick={() => setVariantProduct(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" aria-label="Cerrar">✕</button>
            </div>
            <div className="space-y-2">
              {variantProduct.variants.map((v, idx) => (
                <button
                  key={v.id}
                  disabled={v.stock === 0}
                  onClick={() => {
                    addToCart(variantProduct, idx);
                    setVariantProduct(null);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-[var(--radius-md)] border transition-all duration-150 text-left',
                    v.stock === 0
                      ? 'opacity-40 cursor-not-allowed border-[var(--border-default)]'
                      : 'border-[var(--border-default)] hover:border-[var(--gold-500)] hover:bg-[rgba(201,168,76,0.06)] cursor-pointer',
                  )}
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">{v.name}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-sm font-bold text-[var(--text-primary)]">${v.price.toLocaleString('es-CO')}</span>
                    <span className={cn('text-xs font-medium', v.stock === 0 ? 'text-[var(--danger-text)]' : v.stock <= 5 ? 'text-[var(--warning-text)]' : 'text-[var(--success-text)]')}>
                      {v.stock === 0 ? 'Agotado' : `${v.stock} uds`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {priceInquiryProduct && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="price-inquiry-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPriceInquiryProduct(null);
          }}
        >
          <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-lg)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 id="price-inquiry-title" className="font-bold text-[var(--text-primary)]">
                  Consulta de precios
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">{priceInquiryProduct.name}</p>
              </div>
              <button
                onClick={() => setPriceInquiryProduct(null)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label="Cerrar consulta"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {priceInquiryProduct.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{variant.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">SKU: {variant.sku ?? 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--text-primary)]">${variant.price.toLocaleString('es-CO')}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Stock: {variant.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        open={barcodeScannerOpen}
        onClose={() => setBarcodeScannerOpen(false)}
        onDetected={(value) => {
          setSearch(value);
          toast(`Código detectado: ${value}`, 'success');
        }}
      />
    </div>
  );
}
