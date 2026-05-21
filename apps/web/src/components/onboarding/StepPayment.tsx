'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/auth.store';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onBack: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

type PaymentStep = 'form' | 'processing' | 'success';

export function StepPayment({ data, onBack }: Props) {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);

  const [step, setStep] = useState<PaymentStep>('form');
  const [error, setError] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const isCardValid =
    cardNumber.replace(/\s/g, '').length === 16 &&
    cardName.trim().length >= 3 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  const handlePay = async () => {
    setStep('processing');
    setError('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    try {
      // Simulate payment gateway delay
      await new Promise((r) => setTimeout(r, 2200));

      const res = await fetch(`${apiUrl}/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: data.businessName,
          email: data.email,
          password: data.password,
          ownerName: data.ownerName,
          businessType: data.businessType ?? 'retail_clothing',
          country: 'CO',
          timezone: 'America/Bogota',
          currency: 'COP',
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        let msg = 'Error al crear la cuenta';
        try {
          const err = JSON.parse(raw) as { message?: string | string[] };
          msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? msg);
        } catch { /* use default */ }
        throw new Error(msg);
      }

      const result = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(result.accessToken, result.refreshToken);

      try { window.sessionStorage.removeItem('nexus-onboarding-v2'); } catch { /* ignore */ }

      setStep('success');

      await new Promise((r) => setTimeout(r, 1800));
      router.push('/pos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.');
      setStep('form');
    }
  };

  // ── Processing screen ──────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mb-8"
          style={{ borderColor: 'var(--gold-200)', borderTopColor: 'var(--gold-500)' }}
        />
        <h2 className="text-xl font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Procesando pago...
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Estamos verificando tu tarjeta con el banco.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          No cierres esta ventana.
        </p>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'var(--success-bg)' }}
        >
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          ¡Pago exitoso!
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Tu cuenta ha sido creada. Preparando tu POS...
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Serás redirigido automáticamente.
        </p>
      </div>
    );
  }

  // ── Payment form ───────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-2xl font-display font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Pago
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Ingresa los datos de tu tarjeta para activar tu cuenta.
      </p>

      {/* Order summary */}
      <div
        className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between"
        style={{ background: 'var(--bg-subtle)', border: '1.5px solid var(--border-default)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Plan {data.planName}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {data.businessName} · Facturación mensual
          </p>
        </div>
        <span className="text-lg font-bold" style={{ color: 'var(--gold-600)' }}>
          {formatPrice(data.planPrice ?? 0)}
        </span>
      </div>

      {/* Card fields */}
      <div className="space-y-3 mb-6">
        {/* Card number */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Número de tarjeta
          </label>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5"
            style={{ border: '1.5px solid var(--border-default)', background: 'var(--bg-surface)' }}
          >
            <span className="text-base">💳</span>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Card name */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Nombre en la tarjeta
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            placeholder="JUAN PÉREZ"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{
              border: '1.5px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Vencimiento
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/AA"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                border: '1.5px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              CVV
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="•••"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                border: '1.5px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {['🔒 SSL', '🛡️ PCI DSS', '✓ 3D Secure'].map((b) => (
          <span key={b} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {b}
          </span>
        ))}
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}
        >
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
          style={{ border: '1.5px solid var(--border-default)', color: 'var(--text-secondary)' }}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={!isCardValid}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--gold-500)', color: '#fff' }}
        >
          🔒 Pagar {formatPrice(data.planPrice ?? 0)}
        </button>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
        Tus datos están encriptados y protegidos.
      </p>
    </div>
  );
}
