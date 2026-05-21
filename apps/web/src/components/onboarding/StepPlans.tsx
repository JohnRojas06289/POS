'use client';

import { useEffect, useState } from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  billingCycle: 'monthly' | 'lifetime' | string;
  maxBranches: number;
  maxUsers: number;
}

interface Props {
  selected?: string;
  onNext: (data: { planId: string; planName: string; planPrice: number }) => void;
}

function normalizePlans(payload: unknown): Plan[] {
  if (Array.isArray(payload)) return payload as Plan[];
  if (payload && typeof payload === 'object') {
    const data =
      (payload as { data?: unknown; plans?: unknown }).data ??
      (payload as { plans?: unknown }).plans;
    if (Array.isArray(data)) return data as Plan[];
  }
  return [];
}

function formatPrice(price: number): string {
  if (price === 0) return 'Gratis';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatCycle(plan: Plan): string {
  if (plan.price === 0) return 'Gratis';
  return plan.billingCycle === 'lifetime' ? 'Pago único' : 'Mensual';
}

function formatLimit(value: number, singular: string, plural: string): string {
  if (value < 0) return `Sin límite de ${plural}`;
  return `${value} ${value === 1 ? singular : plural}`;
}

export function StepPlans({ selected, onNext }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedId, setSelectedId] = useState(selected ?? '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/billing/plans`)
      .then((r) => r.json())
      .then((data: unknown) => {
        const normalized = normalizePlans(data);
        setPlans(normalized);
        if (normalized[0] && !selectedId) setSelectedId(normalized[0].id);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected && plans.some((p) => p.id === selected)) setSelectedId(selected);
  }, [plans, selected]);

  if (loading) {
    return (
      <div className="py-16 text-center text-white/30">
        <p className="text-sm">Cargando planes...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div
        className="rounded-xl p-5 text-sm"
        style={{
          background: 'var(--warning-bg)',
          color: 'var(--warning-text)',
          border: '1px solid rgba(133,79,11,0.15)',
        }}
      >
        <p className="font-semibold mb-1">Sin planes disponibles</p>
        <p>El servidor de suscripción no respondió. Intenta de nuevo en unos momentos.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-2xl font-medium tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
        Elige tu plan
      </h2>
      <p className="mb-8 text-sm text-white/45">
        Empieza y escala cuando lo necesites.
      </p>

      <div className="space-y-3 mb-8">
        {plans.map((plan) => {
          const isSelected = selectedId === plan.id;
          const isFree = plan.price === 0;
          const isLifetime = plan.billingCycle === 'lifetime';
          return (
            <button
              key={plan.id}
              onClick={() => setSelectedId(plan.id)}
              className="w-full text-left rounded-xl p-4 transition-all"
              style={{
                border: isSelected
                  ? '2px solid #C9A84C'
                  : '2px solid rgba(255,255,255,0.08)',
                background: isSelected ? 'rgba(201,168,76,0.1)' : '#161616',
                boxShadow: isSelected ? '0 0 0 3px rgba(201,168,76,0.15)' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: isSelected ? '#E8C96A' : '#F2F0EB' }}>
                      {plan.name}
                    </span>
                    {isFree && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        Gratis para empezar
                      </span>
                    )}
                    {!isFree && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: isLifetime ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.08)',
                          color: isLifetime ? '#C9A84C' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {formatCycle(plan)}
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="mb-1.5 text-xs text-white/40">{plan.description}</p>
                  )}
                  <p className="space-y-0.5 text-xs text-white/30">
                    <span className="block">{formatLimit(plan.maxBranches, 'sucursal', 'sucursales')}</span>
                    <span className="block">{formatLimit(plan.maxUsers, 'usuario', 'usuarios')}</span>
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
                    {formatCycle(plan)}
                  </p>
                  <span className="text-lg font-bold" style={{ color: isSelected ? '#C9A84C' : '#F2F0EB' }}>
                    {formatPrice(plan.price)}{plan.price > 0 && plan.billingCycle === 'monthly' ? '/mes' : ''}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div
                  className="mt-3 flex items-center gap-1.5 pt-3 text-xs font-medium text-[#C9A84C]"
                  style={{ borderTop: '1px solid rgba(201,168,76,0.2)' }}
                >
                  <span>✓</span>
                  <span>Plan seleccionado</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => {
          const plan = plans.find((p) => p.id === selectedId);
          if (plan) onNext({ planId: plan.id, planName: plan.name, planPrice: plan.price });
        }}
        disabled={!selectedId}
        className="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: '#C9A84C', color: '#0A0A0A' }}
      >
        Continuar →
      </button>
    </div>
  );
}
