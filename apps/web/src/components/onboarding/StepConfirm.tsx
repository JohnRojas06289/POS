'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/auth.store';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onBack: () => void;
  onPay: () => void;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  retail_clothing: 'Tienda de Ropa / Boutique',
  grocery: 'Supermercado / Abarrotes',
  restaurant: 'Restaurante / Cafetería',
  pharmacy: 'Farmacia / Droguería',
  hardware_store: 'Ferretería / Materiales',
  beauty_salon: 'Salón de Belleza / Spa',
  stationery: 'Papelería / Miscelánea',
};

function formatPrice(price: number): string {
  if (price === 0) return 'Gratis';
  return (
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price) + '/mes'
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function SummaryRow({ label, value, mono }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-white/30">{label}</span>
      <span className={`text-sm font-medium text-white/80 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function StepConfirm({ data, onBack, onPay }: Props) {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isFree = (data.planPrice ?? 0) === 0;

  const handleSubmit = async () => {
    // Paid plans go to payment step
    if (!isFree) {
      onPay();
      return;
    }

    setLoading(true);
    setError('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    try {
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
          const err = JSON.parse(raw) as { message?: string | string[]; error?: string };
          msg = Array.isArray(err.message)
            ? err.message[0]
            : (err.message ?? err.error ?? msg);
        } catch {
          msg = raw || msg;
        }
        throw new Error(msg);
      }

      const result = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(result.accessToken, result.refreshToken);

      try { window.sessionStorage.removeItem('nexus-onboarding-v2'); } catch { /* ignore */ }

      setSuccess(true);
      await new Promise((r) => setTimeout(r, 2200));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen (free plan) ────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
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
          Tu cuenta ha sido creada. Tu plataforma está lista y esperándote.
        </p>

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

  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Todo listo
      </h2>
      <p className="text-sm mb-8 text-white/45">
        Revisa tu información antes de crear la cuenta.
      </p>

      {/* Summary card */}
      <div
        className="rounded-xl mb-6 overflow-hidden"
        style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white/30"
          style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          Resumen
        </div>
        <div className="px-4 divide-y divide-white/[0.06]" style={{ background: '#111111' }}>
          <SummaryRow label="Negocio" value={data.businessName ?? '—'} />
          <SummaryRow
            label="Tipo"
            value={BUSINESS_TYPE_LABELS[data.businessType ?? ''] ?? data.businessType ?? '—'}
          />
          <SummaryRow label="Teléfono" value={data.phone ?? '—'} />
          <SummaryRow label="Responsable" value={data.ownerName ?? '—'} />
          <SummaryRow label="Correo" value={data.email ?? '—'} />
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold text-white/90">
              Plan · {data.planName ?? '—'}
            </span>
            <span className="text-base font-bold" style={{ color: '#C9A84C' }}>
              {formatPrice(data.planPrice ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Free plan notice */}
      {isFree && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
          style={{ background: 'rgba(52,211,153,0.08)', color: '#34D399', border: '1px solid rgba(52,211,153,0.15)' }}
        >
          <span className="text-base flex-shrink-0">🎉</span>
          <p>
            <strong>Comienzas gratis</strong> — sin tarjeta de crédito requerida. Puedes
            actualizar tu plan en cualquier momento desde la configuración.
          </p>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
          style={{ background: 'rgba(240,149,149,0.1)', color: '#F09595', border: '1px solid rgba(240,149,149,0.15)' }}
        >
          <span className="flex-shrink-0">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 hover:text-white/80 text-white/50"
          style={{ border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent' }}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: '#C9A84C', color: '#0A0A0A' }}
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
              Creando cuenta...
            </>
          ) : (
            isFree ? '🚀 Crear cuenta gratis' : '💳 Continuar al pago'
          )}
        </button>
      </div>

      <p className="text-center text-xs text-white/25">
        Al continuar aceptas nuestros{' '}
        <a href="/terms" className="underline" style={{ color: '#C9A84C' }}>
          términos de servicio
        </a>{' '}
        y{' '}
        <a href="/privacy" className="underline" style={{ color: '#C9A84C' }}>
          política de privacidad
        </a>
        .
      </p>
    </div>
  );
}
