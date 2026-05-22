'use client';

import React, { useState, useCallback, useEffect, useId } from 'react';
import { Badge, CurrencyDisplay } from '../ui';
import { cn } from '../../lib/cn';
import { formatCOP } from '../../lib/currency';
import { Receipt } from './Receipt';
import type { ReceiptData } from './Receipt';

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

interface PaymentConfirmation {
  payments: PaymentLine[];
  tipAmount: number;
  tipPercentage?: number;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  cart: CartItemData[];
  hasCustomer: boolean;
  onConfirm: (payload: PaymentConfirmation) => Promise<void>;
  receiptData?: ReceiptData | null;
  tipsEnabled?: boolean;
  suggestedTipPercentage?: number;
}

export type { ReceiptData };
export type { PaymentConfirmation };

const METHODS = [
  { id: 'cash', label: 'Efectivo', icon: '💵' },
  { id: 'card', label: 'Tarjeta', icon: '💳' },
  { id: 'nequi', label: 'Nequi', icon: '📱' },
  { id: 'daviplata', label: 'Daviplata', icon: '📲' },
  { id: 'transfer', label: 'Transferencia', icon: '🏦' },
  { id: 'credit_store', label: 'Fiado', icon: '🤝', requiresCustomer: true },
] as const;

export function PaymentModal({
  open,
  onClose,
  total,
  cart,
  hasCustomer,
  onConfirm,
  receiptData,
  tipsEnabled = false,
  suggestedTipPercentage = 10,
}: PaymentModalProps) {
  const titleId = useId();
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [tipMode, setTipMode] = useState<'none' | 'preset' | 'custom'>('none');
  const [presetTipPercentage, setPresetTipPercentage] = useState<number>(suggestedTipPercentage);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');
  const [countdown, setCountdown] = useState(5);

  const tipAmount = tipMode === 'custom'
    ? Math.max(0, parseFloat(customTipAmount || '0') || 0)
    : tipMode === 'preset'
      ? Math.round((total * presetTipPercentage) / 100)
      : 0;
  const tipPercentage = tipMode === 'preset' ? presetTipPercentage : undefined;
  const payableTotal = total + tipAmount;
  const assigned = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, payableTotal - assigned);
  const change = Math.max(0, assigned - payableTotal);
  const progressPct = payableTotal > 0 ? Math.min(100, (assigned / payableTotal) * 100) : 0;
  const canSettleWithCashChange = change > 0 && payments.some((payment) => payment.method === 'cash');
  const isCompleteWithTip = Math.abs(assigned - payableTotal) < 0.01 || canSettleWithCashChange;
  const canConfirm = isCompleteWithTip && !loading;
  const uniqueTipPresets = Array.from(new Set([5, suggestedTipPercentage, 10, 15].filter((value) => value > 0))).sort((a, b) => a - b);

  useEffect(() => {
    if (!open) return;
    setPayments([]);
    setTipMode('none');
    setPresetTipPercentage(suggestedTipPercentage);
    setCustomTipAmount('');
    setLoading(false);
    setSuccess(false);
    setTxId('');
    setCountdown(5);
  }, [open, suggestedTipPercentage]);

  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      onClose();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, onClose, success]);

  useEffect(() => {
    if (!open) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  const addMethod = useCallback((method: string) => {
    if (payments.some((payment) => payment.method === method)) return;
    setPayments((prev) => [...prev, { method, amount: remaining > 0 ? remaining : 0 }]);
  }, [payments, remaining]);

  const updateAmount = useCallback((method: string, raw: string) => {
    const amount = parseFloat(raw.replace(/\D/g, '')) || 0;
    setPayments((prev) => prev.map((payment) => payment.method === method ? { ...payment, amount } : payment));
  }, []);

  const removeMethod = useCallback((method: string) => {
    setPayments((prev) => prev.filter((payment) => payment.method !== method));
  }, []);

  const quickFill = useCallback((method: string, amount: number) => {
    setPayments((prev) => prev.map((payment) => payment.method === method ? { ...payment, amount: payment.amount + amount } : payment));
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({ payments, tipAmount, tipPercentage });
      setTxId(`#${Math.floor(Math.random() * 90000 + 10000)}`);
      setCountdown(5);
      setSuccess(true);
    } catch {
      setLoading(false);
    }
  };

  void cart;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
        {success ? (
          receiptData ? (
            <div className="p-4 overflow-y-auto max-h-[90vh] space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-subtle)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Venta completada</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Recibo listo para imprimir o compartir</p>
                    <p className="text-xs text-[var(--text-secondary)]">Venta {txId || receiptData.txId} · cierra automáticamente en {countdown}s</p>
                  </div>
                  {change > 0 && <div className="rounded-[var(--radius-sm)] bg-[var(--success-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--success-text)]">Vuelto ${change.toLocaleString('es-CO')}</div>}
                </div>
              </div>
              <Receipt data={receiptData} onClose={onClose} />
            </div>
          ) : (
            <div className="flex flex-col items-center p-8 text-center">
              <div className="relative mb-4 h-20 w-20">
                <svg className="h-20 w-20" viewBox="0 0 100 100" fill="none" aria-hidden>
                  <circle cx="50" cy="50" r="38" stroke="var(--gold-500)" strokeWidth="4" className="draw-circle" />
                  <path d="M33 51.5L45 63L68 37" stroke="var(--gold-500)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-medium tracking-tight text-[var(--text-primary)]">Venta completada</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Venta {txId}</p>
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">Nueva venta en {countdown}s</p>
              {change > 0 && <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--success-bg)] px-4 py-2 text-[var(--success-text)]"><span className="font-medium">Vuelto: </span><CurrencyDisplay amount={change} size="md" gold={false} /></div>}
              <div className="mt-5 w-full space-y-3 sm:flex sm:space-x-3 sm:space-y-0">
                <button onClick={onClose} className="flex-1 rounded-[var(--radius-md)] bg-[var(--gold-500)] px-4 py-3 font-semibold text-[#1A1400] transition-colors hover:bg-[var(--gold-400)]">Nueva venta</button>
                <button onClick={onClose} className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-3 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)]">WhatsApp</button>
              </div>
            </div>
          )
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-[var(--border-default)] p-4">
              <div>
                <h2 id={titleId} style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium tracking-tight text-[var(--text-primary)]">Cobrar</h2>
                <CurrencyDisplay amount={payableTotal} size="xl" gold />
                {tipAmount > 0 && (
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Base {formatCOP(total)} + propina {formatCOP(tipAmount)}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]" aria-label="Cerrar">✕</button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
              {tipsEnabled && (
                <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Propina</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTipMode('none')}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        tipMode === 'none'
                          ? 'border-[var(--gold-500)] bg-[rgba(201,168,76,0.1)] text-[var(--text-gold)]'
                          : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--gold-500)]',
                      )}
                    >
                      Sin propina
                    </button>
                    {uniqueTipPresets.map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setTipMode('preset');
                          setPresetTipPercentage(value);
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          tipMode === 'preset' && presetTipPercentage === value
                            ? 'border-[var(--gold-500)] bg-[rgba(201,168,76,0.1)] text-[var(--text-gold)]'
                            : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--gold-500)]',
                        )}
                      >
                        {value}%
                      </button>
                    ))}
                    <button
                      onClick={() => setTipMode('custom')}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        tipMode === 'custom'
                          ? 'border-[var(--gold-500)] bg-[rgba(201,168,76,0.1)] text-[var(--text-gold)]'
                          : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--gold-500)]',
                      )}
                    >
                      Personalizada
                    </button>
                  </div>
                  {tipMode === 'custom' && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs text-[var(--text-secondary)]">Monto de propina</label>
                      <input
                        type="number"
                        min={0}
                        value={customTipAmount}
                        onChange={(event) => setCustomTipAmount(event.target.value)}
                        className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--gold-500)]"
                        placeholder="0"
                      />
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Propina aplicada</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formatCOP(tipAmount)}</span>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Método de pago</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {METHODS.map((method) => {
                    const active = payments.some((payment) => payment.method === method.id);
                    const disabled = 'requiresCustomer' in method && method.requiresCustomer && !hasCustomer;
                    return (
                      <button
                        key={method.id}
                        onClick={() => !disabled && addMethod(method.id)}
                        disabled={Boolean(disabled)}
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-[var(--radius-md)] border p-3 text-sm transition-all duration-150',
                          active ? 'border-[var(--gold-500)] bg-[rgba(201,168,76,0.08)] text-[var(--text-primary)]' : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]',
                          disabled && 'cursor-not-allowed opacity-40',
                        )}
                        aria-pressed={active}
                        aria-label={method.label}
                      >
                        <span className="text-xl" aria-hidden>{method.icon}</span>
                        <span className="text-xs font-medium">{method.label}</span>
                        {active && <Badge variant="gold">Seleccionado</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {payments.length > 0 && (
                <div className="space-y-2">
                  {payments.map((payment) => {
                    const method = METHODS.find((item) => item.id === payment.method);
                    const isCash = payment.method === 'cash';
                    return (
                      <div key={payment.method} className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden>{method?.icon}</span>
                          <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{method?.label}</span>
                          <input type="number" value={payment.amount || ''} onChange={(event) => updateAmount(payment.method, event.target.value)} min={0} aria-label={`Monto para ${method?.label}`} className="w-28 border-b border-[var(--border-default)] bg-transparent text-right text-sm font-semibold outline-none focus:border-[var(--gold-500)]" />
                          <button onClick={() => removeMethod(payment.method)} className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--danger-text)]" aria-label={`Quitar ${method?.label}`}>✕</button>
                        </div>
                        {isCash && (
                          <div className="flex flex-wrap gap-1" role="group" aria-label="Agregar monto rápido">
                            {[5000, 10000, 20000, 50000].map((amount) => (
                              <button key={amount} onClick={() => quickFill(payment.method, amount)} className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--gold-500)] hover:text-[var(--text-gold)]">
                                +${(amount / 1000).toFixed(0)}K
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {payments.length > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>Asignado ${assigned.toLocaleString('es-CO')} de ${payableTotal.toLocaleString('es-CO')}</span>
                    {change > 0 && <span className="font-medium text-[var(--success-text)]">Vuelto: ${change.toLocaleString('es-CO')}</span>}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className={cn('h-full rounded-full transition-all duration-300', progressPct < 50 ? 'bg-[var(--danger-text)]' : progressPct < 100 ? 'bg-[var(--gold-500)]' : 'bg-[var(--success-text)]')}
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

            <div className="border-t border-[var(--border-default)] p-4">
              <button
                onClick={() => void handleConfirm()}
                disabled={!canConfirm}
                aria-disabled={!canConfirm}
                title={!canConfirm ? 'El monto asignado debe igualar el total a cobrar' : undefined}
                className={cn(
                  'flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] font-semibold transition-all duration-150',
                  canConfirm ? 'bg-[var(--gold-500)] text-[#1A1400] hover:bg-[var(--gold-400)]' : 'cursor-not-allowed bg-[var(--bg-subtle)] text-[var(--text-tertiary)]',
                )}
              >
                {loading ? <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : 'Confirmar pago'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
