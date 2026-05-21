'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/auth.store';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onBack: () => void;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  retail: 'Tienda / Ropa',
  food: 'Restaurante / Café',
  supermarket: 'Supermercado',
  services: 'Servicios',
  pharmacy: 'Farmacia',
  other: 'Otro',
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
      <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <span
        className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

export function StepConfirm({ data, onBack }: Props) {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
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
          businessType: data.businessType ?? 'other',
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

      // Persist tokens and update auth store
      setTokens(result.accessToken, result.refreshToken);

      // Clear onboarding session data
      try {
        window.sessionStorage.removeItem('nexus-onboarding-v2');
      } catch {
        /* ignore */
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const isFree = (data.planPrice ?? 0) === 0;

  return (
    <div>
      <h2
        className="text-2xl font-display font-semibold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        Todo listo
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Revisa tu información antes de crear la cuenta.
      </p>

      {/* Summary card */}
      <div
        className="rounded-xl mb-6 overflow-hidden"
        style={{ border: '1.5px solid var(--border-default)' }}
      >
        <div
          className="px-4 py-3 text-xs font-semibold uppercase tracking-widest"
          style={{
            background: 'var(--bg-subtle)',
            color: 'var(--text-tertiary)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          Resumen
        </div>
        <div className="px-4 divide-y divide-[var(--border-default)]" style={{ background: 'var(--bg-surface)' }}>
          <SummaryRow label="Negocio" value={data.businessName ?? '—'} />
          <SummaryRow
            label="Tipo"
            value={BUSINESS_TYPE_LABELS[data.businessType ?? ''] ?? data.businessType ?? '—'}
          />
          <SummaryRow label="Teléfono" value={data.phone ?? '—'} />
          <SummaryRow label="Responsable" value={data.ownerName ?? '—'} />
          <SummaryRow label="Correo" value={data.email ?? '—'} />
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Plan · {data.planName ?? '—'}
            </span>
            <span
              className="text-base font-bold"
              style={{ color: 'var(--gold-600)' }}
            >
              {formatPrice(data.planPrice ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Free plan notice */}
      {isFree && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
          style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}
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
          style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}
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
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{ border: '1.5px solid var(--border-default)', color: 'var(--text-secondary)' }}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: 'var(--gold-500)', color: '#fff' }}
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creando cuenta...
            </>
          ) : (
            isFree ? '🚀 Crear cuenta gratis' : '💳 Continuar al pago'
          )}
        </button>
      </div>

      <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Al continuar aceptas nuestros{' '}
        <a href="/terms" className="underline" style={{ color: 'var(--gold-600)' }}>
          términos de servicio
        </a>{' '}
        y{' '}
        <a href="/privacy" className="underline" style={{ color: 'var(--gold-600)' }}>
          política de privacidad
        </a>
        .
      </p>
    </div>
  );
}
