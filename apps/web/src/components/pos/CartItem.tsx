'use client';

import React, { useCallback, useState } from 'react';
import { cn } from '../../lib/cn';

interface CartItemData {
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

interface CartItemProps {
  item: CartItemData;
  onQtyChange: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}

export const CartItem = React.memo(function CartItem({ item, onQtyChange, onRemove }: CartItemProps) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState(String(item.quantity));

  const handleQtyBlur = useCallback(() => {
    setEditingQty(false);
    const parsed = parseInt(qtyInput, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= item.maxStock) {
      onQtyChange(item.variantId, parsed);
    } else {
      setQtyInput(String(item.quantity));
    }
  }, [qtyInput, item, onQtyChange]);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[--border] last:border-0 group animate-in slide-in-from-right-2 duration-200">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--text-primary] truncate">{item.productName}</p>
        {item.variantName !== item.productName && (
          <p className="text-xs text-[--text-tertiary] truncate">{item.variantName}</p>
        )}
        <p className="text-xs text-[--text-secondary] mt-0.5">
          ${item.unitPrice.toLocaleString('es-CO')} c/u
        </p>
      </div>

      {/* Qty stepper */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => item.quantity > 1 ? onQtyChange(item.variantId, item.quantity - 1) : onRemove(item.variantId)}
          aria-label="Reducir cantidad"
          className="w-6 h-6 rounded-full border border-[--border] flex items-center justify-center text-sm text-[--text-secondary] hover:border-[--nexus-500] hover:text-[--nexus-500] transition-colors"
        >
          −
        </button>
        {editingQty ? (
          <input
            type="number"
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            onBlur={handleQtyBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleQtyBlur()}
            autoFocus
            min={1}
            max={item.maxStock}
            aria-label="Cantidad"
            className="w-10 text-center text-sm font-medium border border-[--nexus-500] rounded-[--radius-sm] outline-none"
          />
        ) : (
          <button
            onDoubleClick={() => { setEditingQty(true); setQtyInput(String(item.quantity)); }}
            aria-label={`Cantidad: ${item.quantity}. Doble click para editar`}
            className="w-7 text-center text-sm font-bold text-[--text-primary]"
          >
            {item.quantity}
          </button>
        )}
        <button
          onClick={() => item.quantity < item.maxStock && onQtyChange(item.variantId, item.quantity + 1)}
          disabled={item.quantity >= item.maxStock}
          aria-label="Aumentar cantidad"
          className="w-6 h-6 rounded-full border border-[--border] flex items-center justify-center text-sm text-[--text-secondary] hover:border-[--nexus-500] hover:text-[--nexus-500] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0 min-w-[70px]">
        <p className="text-sm font-bold text-[--text-primary] font-mono" data-price>
          ${(item.unitPrice * item.quantity).toLocaleString('es-CO')}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.variantId)}
        aria-label={`Eliminar ${item.productName}`}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-[--text-tertiary] hover:text-[--danger] transition-all duration-150 flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
});
