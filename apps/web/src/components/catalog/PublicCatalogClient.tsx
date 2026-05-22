'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '../../lib/cn';

type CatalogVariant = {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  unitPrice: number;
  stock: number;
};

type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  hasVariants: boolean;
  variants: CatalogVariant[];
};

type BusinessInfo = {
  name: string;
  whatsapp?: string | null;
  country: string;
  currency: string;
  businessType: string;
  posMode: string;
};

type CartItem = {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  stock: number;
  quantity: number;
};

function formatMoney(amount: number, currency: string, country: string): string {
  const locale = country === 'CO' ? 'es-CO' : 'es-ES';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildWhatsAppMessage(
  info: BusinessInfo,
  cart: CartItem[],
  note: string,
  deliveryMode: string,
): string {
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const lines = [
    `Hola, quiero hacer un pedido en *${info.name}*`,
    '',
    ...cart.map((item) => {
      const lineTotal = item.unitPrice * item.quantity;
      return `• ${item.quantity} x ${item.productName}${item.variantName ? ` (${item.variantName})` : ''} - ${formatMoney(lineTotal, info.currency, info.country)}`;
    }),
    '',
    `Total: ${formatMoney(total, info.currency, info.country)}`,
    `Tipo de entrega: ${deliveryMode === 'delivery' ? 'Domicilio' : 'Recoger en tienda'}`,
    note.trim() ? `Nota: ${note.trim()}` : null,
  ].filter(Boolean) as string[];

  return encodeURIComponent(lines.join('\n'));
}

export function PublicCatalogClient({
  info,
  products,
}: {
  info: BusinessInfo;
  products: CatalogProduct[];
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'pickup' | 'delivery'>('pickup');
  const [note, setNote] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});

  const categories = ['all', ...Array.from(new Set(products.map((product) => product.categoryId ?? 'Sin categoría')))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = [product.name, product.description ?? '', product.categoryId ?? '']
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = category === 'all' || (product.categoryId ?? 'Sin categoría') === category;
    return matchesSearch && matchesCategory;
  });

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const waLink = info.whatsapp ? `https://wa.me/${info.whatsapp.replace(/\D/g, '')}` : null;

  const addToCart = (product: CatalogProduct, variant: CatalogVariant) => {
    setCart((current) => {
      const index = current.findIndex((item) => item.variantId === variant.id);
      if (index >= 0) {
        const next = [...current];
        const item = next[index];
        if (item.quantity >= item.stock) return current;
        next[index] = { ...item, quantity: item.quantity + 1 };
        return next;
      }

      return [
        ...current,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          unitPrice: variant.unitPrice,
          stock: variant.stock,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart((current) => current.filter((item) => item.variantId !== variantId));
  };

  const changeQuantity = (variantId: string, delta: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.variantId !== variantId) return [item];
      const quantity = item.quantity + delta;
      if (quantity <= 0) return [];
      if (quantity > item.stock) return [item];
      return [{ ...item, quantity }];
    }));
  };

  const sendOrder = () => {
    if (cart.length === 0 || !waLink) return;
    const message = buildWhatsAppMessage(info, cart, note, deliveryMode);
    window.open(`${waLink}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7e6_0,_#fafafa_34%,_#f3f4f6_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900">
              Catálogo digital
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{info.name}</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Elige productos, arma tu pedido y envíalo por WhatsApp en un solo flujo. La experiencia está pensada para convertir el catálogo en una vitrina real.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{info.businessType}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">{info.currency}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Pedido por WhatsApp</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[28rem] lg:grid-cols-3">
            {[
              { label: 'Productos', value: products.length },
              { label: 'Unidades', value: totalItems },
              { label: 'Total', value: formatMoney(totalAmount, info.currency, info.country) },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                <p className={cn('mt-2 text-lg font-black tracking-tight', card.label === 'Total' && 'text-amber-700')}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_20rem] lg:px-6">
        <section className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Buscar</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Producto, referencia o descripción"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition',
                      category === item
                        ? 'border-amber-400 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    {item === 'all' ? 'Todo' : item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              No hay productos que coincidan con tu búsqueda.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const defaultVariant = product.variants[0];
                const currentVariantId = selectedVariant[product.id] ?? defaultVariant?.id;
                const currentVariant = product.variants.find((variant) => variant.id === currentVariantId) ?? defaultVariant;
                const isSoldOut = !product.variants.some((variant) => variant.stock > 0);

                return (
                  <article key={product.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="relative aspect-[4/3] bg-slate-100">
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 1280px) 50vw, 33vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <svg viewBox="0 0 48 48" width="56" height="56" fill="none" aria-hidden="true">
                            <rect x="6" y="8" width="36" height="32" rx="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M14 30l6-6 6 6 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="18" cy="18" r="4" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </div>
                      )}

                      <div className="absolute left-3 top-3 flex gap-2">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm">
                          {product.categoryId ?? 'Sin categoría'}
                        </span>
                        {isSoldOut && (
                          <span className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
                            Agotado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-base font-bold tracking-tight text-slate-900">{product.name}</h2>
                            {product.description && <p className="mt-1 text-sm leading-6 text-slate-600">{product.description}</p>}
                          </div>
                          {currentVariant && (
                            <div className="text-right">
                              <p className="text-lg font-black text-amber-700">{formatMoney(currentVariant.unitPrice, info.currency, info.country)}</p>
                              <p className="text-xs text-slate-500">Stock: {currentVariant.stock}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Variante</span>
                        <select
                          value={currentVariantId ?? ''}
                          onChange={(e) => setSelectedVariant((current) => ({ ...current, [product.id]: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                        >
                          {product.variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name} · {formatMoney(variant.unitPrice, info.currency, info.country)} · {variant.stock} stock
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        onClick={() => currentVariant && addToCart(product, currentVariant)}
                        disabled={!currentVariant || currentVariant.stock === 0}
                        className={cn(
                          'w-full rounded-2xl px-4 py-3 text-sm font-semibold transition',
                          currentVariant && currentVariant.stock > 0
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'cursor-not-allowed bg-slate-100 text-slate-400',
                        )}
                      >
                        {currentVariant && currentVariant.stock > 0 ? 'Agregar al pedido' : 'Sin stock'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Carrito</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">Tu pedido</h3>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">{totalItems} items</span>
            </div>

            <div className="mt-5 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Agrega productos para armar el pedido.
                </div>
              ) : cart.map((item) => (
                <div key={item.variantId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      <p className="text-sm text-slate-500">{item.variantName}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.variantId)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                      Quitar
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                      <button onClick={() => changeQuantity(item.variantId, -1)} className="px-3 py-2 text-sm font-semibold text-slate-700">-</button>
                      <span className="min-w-10 px-3 py-2 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                      <button onClick={() => changeQuantity(item.variantId, 1)} className="px-3 py-2 text-sm font-semibold text-slate-700">+</button>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{formatMoney(item.unitPrice * item.quantity, info.currency, info.country)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Entrega</span>
                <select
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as 'pickup' | 'delivery')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                >
                  <option value="pickup">Recoger en tienda</option>
                  <option value="delivery">Domicilio</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nota</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribe una indicación para el negocio"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white"
                />
              </label>

              <div className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Total</span>
                  <span>{formatMoney(totalAmount, info.currency, info.country)}</span>
                </div>
                <p className="mt-1 text-2xl font-black tracking-tight">{formatMoney(totalAmount, info.currency, info.country)}</p>
              </div>

              <button
                onClick={sendOrder}
                disabled={!waLink || cart.length === 0}
                className={cn(
                  'w-full rounded-2xl px-4 py-3 text-sm font-semibold transition',
                  waLink && cart.length > 0
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'cursor-not-allowed bg-slate-100 text-slate-400',
                )}
              >
                Enviar pedido por WhatsApp
              </button>

              {!waLink && (
                <p className="text-xs leading-5 text-slate-500">
                  Este negocio todavía no tiene número de WhatsApp configurado.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Experiencia</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p>• Catálogo visible por categoría.</p>
              <p>• Variantes con stock y precio.</p>
              <p>• Pedido listo para WhatsApp con total calculado.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
