'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onBack: () => void;
}

export function StepPayment({ data, onBack }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPrice = (price: number) =>
    price === 0
      ? 'Gratis'
      : new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(price) + '/mes';

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    try {
      const regRes = await fetch(`${apiUrl}/onboarding/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: data.businessName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          schemaName: data.schemaName,
          planId: data.planId,
          templateId: data.templateId ?? 'default',
        }),
      });

      if (!regRes.ok) {
        const err = (await regRes.json()) as { message?: string | string[] };
        const msg = Array.isArray(err.message) ? err.message[0] : (err.message ?? 'Error al registrarse');
        throw new Error(msg);
      }

      const result = (await regRes.json()) as { tenantId: string; requiresPayment: boolean };

      if (result.requiresPayment) {
        router.push(`/onboarding/success?tenantId=${result.tenantId}&payment=pending`);
        return;
      }

      router.push(`/login?registered=1&email=${encodeURIComponent(data.email ?? '')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumen y confirmación</h2>
      <p className="text-gray-500 mb-6">Revisa tu información antes de continuar.</p>

      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Negocio</span>
          <span className="font-medium">{data.businessName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Identificador</span>
          <span className="font-mono text-blue-700">{data.schemaName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Email</span>
          <span className="font-medium">{data.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Plan</span>
          <span className="font-medium">{data.planName}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Total mensual</span>
          <span className="font-bold text-blue-700">{formatPrice(data.planPrice ?? 0)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Creando cuenta...' : data.planPrice === 0 ? 'Crear cuenta gratis' : 'Ir al pago'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Al continuar, aceptas nuestros{' '}
        <a href="/terms" className="underline">términos de servicio</a>
        {' '}y{' '}
        <a href="/privacy" className="underline">política de privacidad</a>.
      </p>
    </div>
  );
}
