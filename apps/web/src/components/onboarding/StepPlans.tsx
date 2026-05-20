'use client';

import { useEffect, useState } from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  maxBranches: number;
  maxUsers: number;
}

interface Props {
  selected?: string;
  onNext: (data: { planId: string; planName: string; planPrice: number }) => void;
}

export function StepPlans({ selected, onNext }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedId, setSelectedId] = useState(selected ?? '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${apiUrl}/billing/plans`)
      .then((r) => r.json())
      .then((data: Plan[]) => {
        setPlans(data);
        if (data[0] && !selectedId) setSelectedId(data[0].id);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    price === 0
      ? 'Gratis'
      : new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(price) + '/mes';

  if (loading) return <div className="text-center py-8 text-gray-400">Cargando planes...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Elige tu plan</h2>
      <p className="text-gray-500 mb-6">Empieza gratis, escala cuando lo necesites.</p>

      <div className="grid gap-3 mb-8">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedId(plan.id)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${
              selectedId === plan.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">{plan.name}</span>
                {plan.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {plan.maxBranches} sucursal{plan.maxBranches > 1 ? 'es' : ''} · {plan.maxUsers} usuarios
                </p>
              </div>
              <span className="text-xl font-bold text-blue-700 whitespace-nowrap ml-4">
                {formatPrice(plan.price)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          const plan = plans.find((p) => p.id === selectedId);
          if (plan) onNext({ planId: plan.id, planName: plan.name, planPrice: plan.price });
        }}
        disabled={!selectedId}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
      >
        Continuar
      </button>
    </div>
  );
}
