'use client';

import React, { useCallback } from 'react';
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

const CATEGORY_COLORS: Record<string, string> = {
  food: 'from-orange-100 to-amber-50',
  drink: 'from-blue-100 to-cyan-50',
  clothing: 'from-purple-100 to-pink-50',
  electronics: 'from-slate-100 to-gray-50',
  default: 'from-[--nexus-300]/20 to-[--nexus-400]/10',
};

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return (
    <span className="text-xs text-[--danger] font-medium flex items-center gap-0.5">
      <span aria-hidden>✗</span> Agotado
    </span>
  );
  if (stock <= 5) return (
    <span className="text-xs text-[--warning] font-medium flex items-center gap-0.5">
      <span aria-hidden>⚠</span> {stock}
    </span>
  );
  return (
    <span className="text-xs text-[--success] font-medium flex items-center gap-0.5">
      <span aria-hidden>✓</span> {stock}
    </span>
  );
}

export const ProductCard = React.memo(function ProductCard({
  product, onAdd, onSelectVariant,
}: ProductCardProps) {
  const primaryVariant = product.variants[0];
  const isOutOfStock = product.variants.every((v) => v.stock === 0);
  const hasVariants = product.variants.length > 1;

  const handleClick = useCallback(() => {
    if (isOutOfStock) return;
    if (hasVariants) {
      onSelectVariant(product);
    } else {
      onAdd(product, 0);
    }
  }, [isOutOfStock, hasVariants, product, onAdd, onSelectVariant]);

  const price = primaryVariant?.price ?? 0;
  const stock = primaryVariant?.stock ?? 0;

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      aria-label={`${product.name}, ${isOutOfStock ? 'sin stock' : `$${price.toLocaleString('es-CO')}`}`}
      className={cn(
        'relative flex flex-col rounded-[--radius-lg] border border-[--border] bg-[--bg-primary]',
        'text-left overflow-hidden transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-[--nexus-500] focus-visible:outline-offset-2',
        isOutOfStock
          ? 'opacity-50 cursor-not-allowed grayscale-[80%]'
          : 'hover:border-[--nexus-500] hover:shadow-[--shadow-md] hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
        'shadow-[--shadow-sm]',
      )}
    >
      {/* Image / Placeholder */}
      <div className={cn(
        'w-full aspect-square flex items-center justify-center overflow-hidden',
        !product.imageUrl && `bg-gradient-to-br ${CATEGORY_COLORS[product.categoryId ?? 'default']}`,
      )}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl opacity-40" aria-hidden>🛒</span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[--radius-lg]">
            <span className="text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded-full">Sin stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-xs font-medium text-[--text-primary] line-clamp-2 leading-tight">
          {product.name}
        </p>
        <div className="mt-auto flex items-end justify-between gap-1">
          <span className="text-sm font-bold text-[--text-primary] font-mono" data-price>
            ${price.toLocaleString('es-CO')}
          </span>
          <StockBadge stock={stock} />
        </div>
        {hasVariants && !isOutOfStock && (
          <span className="text-xs text-[--nexus-500] font-medium">Elige variante ›</span>
        )}
      </div>
    </button>
  );
});
