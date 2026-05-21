'use client';

import React, { useState } from 'react';
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

      await new Promise((r) => setTimeout(r, 2000));
      router.push('/dashboard');
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
          className="w-16 h-16 rounded-full border-4 animate-spin mb-8"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
        <h2 className="text-xl font-medium tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Procesando pago...
        </h2>
        <p className="text-sm text-white/45">
          Estamos verificando tu tarjeta con el banco.
        </p>
        <p className="text-xs mt-2 text-white/25">
          No cierres esta ventana.
        </p>
      </div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        {/* Animated gold checkmark */}
        <div className="relative mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.08)', border: '1.5px solid rgba(201,168,76,0.25)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 48px rgba(201,168,76,0.18)' }} />
        </div>

        <h2 className="text-2xl font-medium tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          ¡Tu negocio está listo!
        </h2>
        {data.businessName && (
          <p className="text-sm font-semibold mb-3" style={{ color: '#C9A84C' }}>
            {data.businessName}
          </p>
        )}
        <p className="text-sm text-white/40 mb-10 max-w-xs leading-relaxed">
          Tu cuenta ha sido creada y tu plataforma está lista.<br />
          Accederás en un momento.
        </p>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#C9A84C' }} />
          <div className="w-14 h-px" style={{ background: '#C9A84C' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#C9A84C' }} />
          <div className="w-14 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <p className="mt-3 text-xs text-white/25">Preparando tu espacio...</p>
      </div>
    );
  }

  const inputStyle = {
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: '#161616',
    color: 'rgba(242,240,235,0.9)',
  };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#C9A84C');
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)');

  // ── Payment form ───────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Pago
      </h2>
      <p className="text-sm mb-6 text-white/45">
        Ingresa los datos de tu tarjeta para activar tu cuenta.
      </p>

      {/* Order summary */}
      <div
        className="rounded-xl px-4 py-3 mb-6 flex items-center justify-between"
        style={{ background: '#161616', border: '1.5px solid rgba(255,255,255,0.1)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-white/30">
            Plan {data.planName}
          </p>
          <p className="text-xs text-white/45">
            {data.businessName} · Facturación mensual
          </p>
        </div>
        <span className="text-lg font-bold" style={{ color: '#C9A84C' }}>
          {formatPrice(data.planPrice ?? 0)}
        </span>
      </div>

      {/* Card fields */}
      <div className="space-y-3 mb-6">
        {/* Card number */}
        <div>
          <label className="block text-xs font-medium mb-1 text-white/55">
            Número de tarjeta
          </label>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all"
            style={inputStyle}
          >
            <span className="text-base">💳</span>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-white/20"
              style={{ color: 'rgba(242,240,235,0.9)' }}
            />
          </div>
        </div>

        {/* Card name */}
        <div>
          <label className="block text-xs font-medium mb-1 text-white/55">
            Nombre en la tarjeta
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            placeholder="JUAN PÉREZ"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all placeholder:text-white/20"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-white/55">
              Vencimiento
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/AA"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all placeholder:text-white/20"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-white/55">
              CVV
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="•••"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all placeholder:text-white/20"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {['🔒 SSL', '🛡️ PCI DSS', '✓ 3D Secure'].map((b) => (
          <span key={b} className="text-xs text-white/25">
            {b}
          </span>
        ))}
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
          style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595', border: '1px solid rgba(240,149,149,0.15)' }}
        >
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:text-white/80 text-white/50"
          style={{ border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent' }}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={!isCardValid}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: '#C9A84C', color: '#0A0A0A' }}
        >
          🔒 Pagar {formatPrice(data.planPrice ?? 0)}
        </button>
      </div>

      <p className="text-center text-xs mt-4 text-white/25">
        Tus datos están encriptados y protegidos.
      </p>
    </div>
  );
}
