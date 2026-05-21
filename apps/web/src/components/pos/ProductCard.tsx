'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { Badge } from '../ui';
import { cn } from '../../lib/cn';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  imageUrl?: string | null;
  variants: ProductVariant[];
  categoryId?: string | null;
}

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product, variantIdx: number) => void;
  onSelectVariant: (product: Product) => void;
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="danger">Agotado</Badge>;
  if (stock <= 5) return <Badge variant="warning" dot>Stock bajo</Badge>;
  return <Badge variant="success" dot>Disponible</Badge>;
}

export const ProductCard = React.memo(function ProductCard({ product, onAdd, onSelectVariant }: ProductCardProps) {
  const primaryVariant = product.variants[0];
  const isOutOfStock = product.variants.every((variant) => variant.stock === 0);
  const hasVariants = product.variants.length > 1;

  const handleClick = useCallback(() => {
    if (isOutOfStock) return;
    if (hasVariants) onSelectVariant(product);
    else onAdd(product, 0);
  }, [hasVariants, isOutOfStock, onAdd, onSelectVariant, product]);

  const price = primaryVariant?.price ?? 0;
  const stock = primaryVariant?.stock ?? 0;

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      aria-label={`${product.name}, ${isOutOfStock ? 'sin stock' : `$${price.toLocaleString('es-CO')}`}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-left shadow-[var(--shadow-sm)] transition-all duration-150',
        isOutOfStock
          ? 'opacity-50 grayscale-[70%] cursor-not-allowed'
          : 'cursor-pointer hover:-translate-y-0.5 hover:border-[var(--border-gold)] hover:shadow-[var(--shadow-md)]',
      )}
    >
      <div className={cn('relative aspect-square overflow-hidden', !product.imageUrl && 'bg-gradient-to-br from-[rgba(201,168,76,0.18)] via-[rgba(201,168,76,0.08)] to-[var(--bg-subtle)]')}>
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.08)] text-3xl text-[var(--text-gold)]">
              🛒
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={isOutOfStock ? 'danger' : stock <= 5 ? 'warning' : 'success'} dot>
            {isOutOfStock ? 'Sin stock' : `${stock} uds`}
          </Badge>
        </div>
        {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-semibold uppercase tracking-[0.2em] text-white">Sin stock</div>}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-tight text-[var(--text-primary)]">{product.name}</p>
        <div className="mt-auto flex items-end justify-between gap-2">
          <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[15px] font-medium text-[var(--text-gold-bright)]">
            ${price.toLocaleString('es-CO')}
          </span>
          {hasVariants && !isOutOfStock && <span className="text-[11px] font-medium text-[var(--text-tertiary)]">Elegir variante</span>}
        </div>
      </div>
    </button>
  );
});
