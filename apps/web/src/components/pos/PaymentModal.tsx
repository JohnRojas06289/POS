'use client';

import React, { useState, useCallback, useEffect, useId } from 'react';
import { cn } from '../../lib/cn';

interface CartItemData {
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

interface PaymentLine {
  method: string;
  amount: number;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  cart: CartItemData[];
  hasCustomer: boolean;
  onConfirm: (payments: PaymentLine[]) => Promise<void>;
}

const METHODS = [
  { id: 'cash', label: 'Efectivo', icon: '💵' },
  { id: 'card', label: 'Tarjeta', icon: '💳' },
  { id: 'nequi', label: 'Nequi', icon: '📱' },
  { id: 'daviplata', label: 'Daviplata', icon: '📲' },
  { id: 'transfer', label: 'Transferencia', icon: '🏦' },
  { id: 'credit', label: 'Fiado', icon: '🤝', requiresCustomer: true },
] as const;

export function PaymentModal({ open, onClose, total, cart, hasCustomer, onConfirm }: PaymentModalProps) {
  const titleId = useId();
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');

  const assigned = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, total - assigned);
  const change = Math.max(0, assigned - total);
  const progressPct = Math.min(100, (assigned / total) * 100);
  const isComplete = Math.abs(assigned - total) < 0.01 || (change > 0 && payments.some((p) => p.method === 'cash'));
  const canConfirm = isComplete && !loading;

  useEffect(() => {
    if (open) { setPayments([]); setLoading(false); setSuccess(false); setTxId(''); }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  const addMethod = useCallback((method: string) => {
    if (payments.find((p) => p.method === method)) return;
    setPayments((prev) => [...prev, { method, amount: remaining > 0 ? remaining : 0 }]);
  }, [payments, remaining]);

  const updateAmount = useCallback((method: string, raw: string) => {
    const amount = parseFloat(raw.replace(/\D/g, '')) || 0;
    setPayments((prev) => prev.map((p) => p.method === method ? { ...p, amount } : p));
  }, []);

  const removeMethod = useCallback((method: string) => {
    setPayments((prev) => prev.filter((p) => p.method !== method));
  }, []);

  const quickFill = useCallback((method: string, amount: number) => {
    setPayments((prev) => prev.map((p) => p.method === method ? { ...p, amount: p.amount + amount } : p));
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(payments);
      setTxId(`#${Math.floor(Math.random() * 90000 + 10000)}`);
      setSuccess(true);
    } catch {
      setLoading(false);
    }
  };

  // Suppress unused variable warning — cart is passed for future use (e.g. receipt)
  void cart;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-[--bg-primary] rounded-[--radius-xl] shadow-[--shadow-lg] animate-in slide-in-from-bottom-2 zoom-in-95 duration-250 overflow-hidden">
        {success ? (
          /* Success Screen */
          <div className="p-8 flex flex-col items-center text-center">
            <div className="relative w-20 h-20 mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in duration-300">
                <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path className="animate-[draw_600ms_ease_forwards]" d="M4 12l6 6L20 6" style={{ strokeDasharray: 28, strokeDashoffset: 28, animation: 'draw 600ms ease forwards' }} />
                </svg>
              </div>
            </div>
            <style>{`@keyframes draw { to { stroke-dashoffset: 0 } }`}</style>
            <h2 className="text-2xl font-bold text-[--text-primary] mb-1">¡Venta completada!</h2>
            <p className="text-[--text-secondary] mb-1">Venta {txId}</p>
            {change > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-[--radius-md] px-4 py-2 mb-4">
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  Vuelto: <span className="font-bold font-mono">${change.toLocaleString('es-CO')}</span>
                </p>
              </div>
            )}
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={onClose}
                className="flex-1 h-11 bg-[--nexus-500] text-white font-semibold rounded-[--radius-md] hover:bg-[#1d4ed8] transition-colors"
              >
                Nueva venta
              </button>
              <button
                onClick={onClose}
                className="h-11 px-4 border border-[--border] text-[--text-secondary] rounded-[--radius-md] hover:bg-[--bg-tertiary] transition-colors text-sm"
              >
                📱 WhatsApp
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[--border]">
              <div>
                <h2 id={titleId} className="text-lg font-bold text-[--text-primary]">Cobrar</h2>
                <p className="text-2xl font-bold font-mono text-[--nexus-500]">
                  ${total.toLocaleString('es-CO')}
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-md] hover:bg-[--bg-tertiary] text-[--text-secondary] transition-colors" aria-label="Cerrar">✕</button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Payment methods */}
              <div>
                <p className="text-xs font-medium text-[--text-tertiary] uppercase tracking-wide mb-2">Método de pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => {
                    const active = !!payments.find((p) => p.method === m.id);
                    const disabled = 'requiresCustomer' in m && m.requiresCustomer && !hasCustomer;
                    return (
                      <button
                        key={m.id}
                        onClick={() => !disabled && addMethod(m.id)}
                        disabled={!!disabled}
                        title={disabled ? 'Selecciona un cliente primero' : undefined}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-[--radius-md] border transition-all duration-150 text-sm',
                          active
                            ? 'border-[--nexus-500] bg-[--nexus-500]/8 text-[--nexus-500]'
                            : 'border-[--border] hover:border-[--border-strong] text-[--text-secondary]',
                          disabled && 'opacity-40 cursor-not-allowed',
                        )}
                        aria-pressed={active}
                        aria-label={m.label}
                      >
                        <span className="text-xl" aria-hidden>{m.icon}</span>
                        <span className="text-xs font-medium">{m.label}</span>
                        {active && <span className="text-xs text-[--nexus-500]" aria-hidden>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment lines */}
              {payments.length > 0 && (
                <div className="space-y-2">
                  {payments.map((p) => {
                    const method = METHODS.find((m) => m.id === p.method);
                    const isCash = p.method === 'cash';
                    return (
                      <div key={p.method} className="rounded-[--radius-md] border border-[--border] p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden>{method?.icon}</span>
                          <span className="text-sm font-medium text-[--text-primary] flex-1">{method?.label}</span>
                          <input
                            type="number"
                            value={p.amount || ''}
                            onChange={(e) => updateAmount(p.method, e.target.value)}
                            min={0}
                            aria-label={`Monto para ${method?.label}`}
                            className="w-28 text-right text-sm font-mono font-bold border-b border-[--border] focus:border-[--nexus-500] outline-none bg-transparent text-[--text-primary]"
                          />
                          <button
                            onClick={() => removeMethod(p.method)}
                            className="text-[--text-tertiary] hover:text-[--danger] transition-colors"
                            aria-label={`Quitar ${method?.label}`}
                          >✕</button>
                        </div>
                        {isCash && (
                          <div className="flex gap-1 flex-wrap" role="group" aria-label="Agregar monto rápido">
                            {[5000, 10000, 20000, 50000].map((amt) => (
                              <button
                                key={amt}
                                onClick={() => quickFill(p.method, amt)}
                                className="text-xs px-2 py-0.5 rounded-full border border-[--border] text-[--text-secondary] hover:border-[--nexus-500] hover:text-[--nexus-500] transition-colors"
                                aria-label={`Agregar $${(amt/1000).toFixed(0)}K`}
                              >
                                +${(amt / 1000).toFixed(0)}K
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Progress */}
              {payments.length > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-[--text-secondary] mb-1">
                    <span>Asignado ${assigned.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')}</span>
                    {change > 0 && <span className="text-green-600 font-medium">Vuelto: ${change.toLocaleString('es-CO')}</span>}
                  </div>
                  <div className="h-2 rounded-full bg-[--bg-tertiary] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        progressPct < 50 ? 'bg-[--danger]'
                        : progressPct < 100 ? 'bg-[--warning]'
                        : 'bg-[--success]',
                      )}
                      style={{ width: `${progressPct}%` }}
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Progreso del pago"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[--border]">
              <button
                onClick={() => void handleConfirm()}
                disabled={!canConfirm}
                aria-disabled={!canConfirm}
                title={!canConfirm ? 'El monto asignado debe igual al total' : undefined}
                className={cn(
                  'w-full h-12 font-semibold rounded-[--radius-md] transition-all duration-150 flex items-center justify-center gap-2',
                  canConfirm
                    ? 'bg-[--nexus-500] text-white hover:bg-[#1d4ed8] active:scale-[0.99] shadow-[--shadow-sm]'
                    : 'bg-[--bg-tertiary] text-[--text-tertiary] cursor-not-allowed',
                )}
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : '✓ Confirmar pago'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
