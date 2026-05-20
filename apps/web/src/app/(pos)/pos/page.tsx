'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SearchBar } from '../../../components/pos/SearchBar';
import { ProductCard } from '../../../components/pos/ProductCard';
import { CartItem } from '../../../components/pos/CartItem';
import { PaymentModal } from '../../../components/pos/PaymentModal';
import { SkeletonGrid } from '../../../components/ui/Skeleton';
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
}

const CART_KEY = 'nexus-pos-cart';

export default function POSPage() {
  const { toast } = useToast();
  const { isOnline, addPendingOrder } = useOfflineStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItemState[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load products
  useEffect(() => {
    void (async () => {
      try {
        const data = await posApi.getProducts() as Product[];
        setProducts(data);
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
      if (e.key === 'Escape') {
        setPaymentOpen(false);
        setVariantProduct(null);
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
  }, [cart]);

  // Filtered products
  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.variants.some((v) => v.sku?.toLowerCase().includes(q)),
    );
  }, [products, search]);

  const addToCart = useCallback((product: Product, variantIdx: number) => {
    const variant = product.variants[variantIdx];
    if (!variant || variant.stock === 0) return;

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
  }, [toast]);

  const updateQty = useCallback((variantId: string, qty: number) => {
    setCart((prev) => prev.map((i) => i.variantId === variantId ? { ...i, quantity: qty } : i));
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const handleClear = useCallback(() => {
    if (clearConfirm) {
      setCart([]);
      setClearConfirm(false);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    } else {
      setClearConfirm(true);
      clearTimer.current = setTimeout(() => setClearConfirm(false), 2000);
    }
  }, [clearConfirm]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const handleConfirmPayment = useCallback(async (payments: Array<{ method: string; amount: number }>) => {
    const localId = uuidv4();
    const payload = {
      localId,
      branchId: 'default',
      items: cart.map((i) => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice })),
      payments,
    };

    if (!isOnline) {
      addPendingOrder(payload);
      localStorage.removeItem(CART_KEY);
      setCart([]);
      return;
    }

    try {
      await posApi.createOrder(payload);
    } catch {
      // Fallback: save offline
      addPendingOrder(payload);
    }
    localStorage.removeItem(CART_KEY);
    setCart([]);
  }, [cart, isOnline, addPendingOrder]);

  return (
    <div className="flex h-full">
      {/* Left: Catalog */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[--border]">
        {/* Search */}
        <div className="p-3 border-b border-[--border] bg-[--bg-primary]">
          <SearchBar
            value={search}
            onChange={setSearch}
            resultCount={search ? filtered.length : undefined}
          />
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <SkeletonGrid count={12} />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <span className="text-5xl mb-3" aria-hidden>🔍</span>
              <p className="text-[--text-secondary] font-medium">Sin resultados</p>
              <p className="text-sm text-[--text-tertiary]">Intenta con otro término</p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
              aria-label="Catálogo de productos"
            >
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  onSelectVariant={(p) => setVariantProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-[--bg-primary]">
        {/* Cart header */}
        <div className="flex items-center justify-between p-3 border-b border-[--border]">
          <h2 className="font-semibold text-[--text-primary]">
            Carrito
            {itemCount > 0 && (
              <span className="ml-2 bg-[--nexus-500] text-white text-xs font-bold rounded-full px-2 py-0.5">
                {itemCount}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button
              onClick={handleClear}
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-[--radius-sm] transition-all duration-150',
                clearConfirm
                  ? 'bg-red-50 text-[--danger] border border-[--danger]'
                  : 'text-[--text-tertiary] hover:text-[--danger] hover:bg-red-50',
              )}
              aria-label="Limpiar carrito"
            >
              {clearConfirm ? '¿Seguro?' : 'Limpiar'}
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3" aria-label="Items en el carrito">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <span className="text-4xl mb-2" aria-hidden>🛒</span>
              <p className="text-sm text-[--text-tertiary]">El carrito está vacío</p>
              <p className="text-xs text-[--text-tertiary] mt-1">Click en un producto para agregar</p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem
                key={item.variantId}
                item={item}
                onQtyChange={updateQty}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {/* Totals + actions */}
        <div className="border-t border-[--border] p-3 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-[--text-secondary]">
              <span>{itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}</span>
              <span className="font-mono">${total.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base font-semibold text-[--text-primary]">Total</span>
              <span className="text-xl font-bold font-mono text-[--text-primary]">
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {!isOnline && cart.length > 0 && (
            <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-[--radius-sm] px-2 py-1.5">
              ⚠ Sin conexión — la venta se sincronizará al reconectar
            </div>
          )}

          <button
            onClick={() => setPaymentOpen(true)}
            disabled={cart.length === 0}
            aria-disabled={cart.length === 0}
            title={cart.length === 0 ? 'Agrega productos al carrito' : `Cobrar $${total.toLocaleString('es-CO')} (F2)`}
            className={cn(
              'w-full h-12 font-bold rounded-[--radius-md] transition-all duration-150 text-base',
              cart.length > 0
                ? 'bg-[--nexus-500] text-white hover:bg-[#1d4ed8] shadow-[--shadow-sm] hover:shadow-[--shadow-md] active:scale-[0.99] animate-pulse-subtle'
                : 'bg-[--bg-tertiary] text-[--text-tertiary] cursor-not-allowed',
            )}
          >
            {cart.length > 0 ? `Cobrar $${total.toLocaleString('es-CO')}` : 'Cobrar'}
          </button>
          <style>{`
            @keyframes pulse-subtle { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.4)} 50%{box-shadow:0 0 0 6px rgba(37,99,235,0)} }
            .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }
          `}</style>
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
          <div className="bg-[--bg-primary] rounded-[--radius-xl] shadow-[--shadow-lg] p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[--text-primary]">{variantProduct.name}</h3>
              <button onClick={() => setVariantProduct(null)} className="text-[--text-tertiary] hover:text-[--text-primary]" aria-label="Cerrar">✕</button>
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
                    'w-full flex items-center justify-between p-3 rounded-[--radius-md] border transition-all duration-150 text-left',
                    v.stock === 0
                      ? 'opacity-40 cursor-not-allowed border-[--border]'
                      : 'border-[--border] hover:border-[--nexus-500] hover:bg-[--nexus-500]/5 cursor-pointer',
                  )}
                >
                  <span className="text-sm font-medium text-[--text-primary]">{v.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-[--text-primary]">${v.price.toLocaleString('es-CO')}</span>
                    <span className={cn('text-xs font-medium', v.stock === 0 ? 'text-[--danger]' : v.stock <= 5 ? 'text-[--warning]' : 'text-[--success]')}>
                      {v.stock === 0 ? 'Agotado' : `${v.stock} uds`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
