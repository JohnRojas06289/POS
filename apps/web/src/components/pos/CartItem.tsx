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
  discountAmount?: number;
}

interface CartItemProps {
  item: CartItemData;
  onQtyChange: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
  onApplyDiscount: (variantId: string) => void;
}

export const CartItem = React.memo(function CartItem({ item, onQtyChange, onRemove, onApplyDiscount }: CartItemProps) {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState(String(item.quantity));
  const subtotal = item.unitPrice * item.quantity;
  const discount = item.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const handleQtyBlur = useCallback(() => {
    setEditingQty(false);
    const parsed = parseInt(qtyInput, 10);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= item.maxStock) onQtyChange(item.variantId, parsed);
    else setQtyInput(String(item.quantity));
  }, [item.maxStock, item.quantity, item.variantId, onQtyChange, qtyInput]);

  return (
    <div className="group flex items-start gap-3 border-b border-[var(--border-default)] py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.productName}</p>
        {item.variantName !== item.productName && <p className="truncate text-xs text-[var(--text-tertiary)]">{item.variantName}</p>}
        <p style={{ fontFamily: 'var(--font-mono)' }} className="mt-1 text-xs text-[var(--text-secondary)]">${item.unitPrice.toLocaleString('es-CO')} c/u</p>
        {discount > 0 && <p className="mt-1 text-xs text-[var(--success-text)]">Descuento: -${discount.toLocaleString('es-CO')}</p>}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] p-1">
        <button onClick={() => item.quantity > 1 ? onQtyChange(item.variantId, item.quantity - 1) : onRemove(item.variantId)} aria-label="Reducir cantidad" className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]">−</button>
        {editingQty ? (
          <input
            type="number"
            value={qtyInput}
            onChange={(event) => setQtyInput(event.target.value)}
            onBlur={handleQtyBlur}
            onKeyDown={(event) => event.key === 'Enter' && handleQtyBlur()}
            autoFocus
            min={1}
            max={item.maxStock}
            aria-label="Cantidad"
            className="w-10 rounded-full border border-[var(--gold-500)] bg-[var(--bg-surface)] text-center text-sm font-medium outline-none"
          />
        ) : (
          <button onDoubleClick={() => { setEditingQty(true); setQtyInput(String(item.quantity)); }} aria-label={`Cantidad: ${item.quantity}. Doble click para editar`} className="w-8 text-center text-sm font-semibold text-[var(--text-primary)]">{item.quantity}</button>
        )}
        <button onClick={() => item.quantity < item.maxStock && onQtyChange(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.maxStock} aria-label="Aumentar cantidad" className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30">+</button>
      </div>

      <div className="min-w-[88px] flex-shrink-0 text-right">
        {discount > 0 && <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[var(--text-tertiary)] line-through">${subtotal.toLocaleString('es-CO')}</p>}
        <p style={{ fontFamily: 'var(--font-mono)' }} className="text-sm font-medium text-[var(--text-primary)]">${total.toLocaleString('es-CO')}</p>
      </div>

      <div className="flex flex-col items-center gap-1">
        <button onClick={() => onApplyDiscount(item.variantId)} aria-label={`Aplicar descuento a ${item.productName}`} className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-gold)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[rgba(201,168,76,0.1)]">Desc.</button>
        <button onClick={() => onRemove(item.variantId)} aria-label={`Eliminar ${item.productName}`} className="rounded-full p-1 text-[var(--text-tertiary)] opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-[var(--bg-subtle)] hover:text-[var(--danger-text)]">✕</button>
      </div>
    </div>
  );
});
