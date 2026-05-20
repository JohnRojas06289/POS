'use client';

import { useState, useEffect } from 'react';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onNext: (data: Pick<OnboardingData, 'businessName' | 'schemaName' | 'phone' | 'templateId'>) => void;
  onBack: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30);
}

export function StepBusiness({ data, onNext, onBack }: Props) {
  const [businessName, setBusinessName] = useState(data.businessName ?? '');
  const [schemaName, setSchemaName] = useState(data.schemaName ?? '');
  const [phone, setPhone] = useState(data.phone ?? '');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (businessName && !data.schemaName) {
      setSchemaName(slugify(businessName));
    }
  }, [businessName]);

  useEffect(() => {
    if (!schemaName || schemaName.length < 3) { setAvailable(null); return; }
    setChecking(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const timer = setTimeout(() => {
      fetch(`${apiUrl}/onboarding/check-schema?name=${schemaName}`)
        .then((r) => r.json())
        .then((res: { available: boolean }) => setAvailable(res.available))
        .catch(() => setAvailable(null))
        .finally(() => setChecking(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [schemaName]);

  const canContinue = businessName.length >= 2 && phone.length >= 7 && available === true;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu negocio</h2>
      <p className="text-gray-500 mb-6">Cuéntanos sobre tu empresa.</p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Arepas El Mono"
            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Identificador único *</label>
          <div className="relative">
            <input
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="arepas_el_mono"
              className={`w-full rounded-lg border px-3 py-2.5 pr-28 text-sm font-mono focus:outline-none focus:ring-2 ${
                available === false
                  ? 'border-red-400 focus:ring-red-400'
                  : available === true
                  ? 'border-green-400 focus:ring-green-400'
                  : 'focus:ring-blue-500'
              }`}
            />
            {checking && (
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">Verificando...</span>
            )}
            {!checking && available === true && (
              <span className="absolute right-3 top-2.5 text-xs text-green-600 font-medium">✓ Disponible</span>
            )}
            {!checking && available === false && (
              <span className="absolute right-3 top-2.5 text-xs text-red-500 font-medium">✗ No disponible</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y guiones bajos.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="3001234567"
            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={() => onNext({ businessName, schemaName, phone, templateId: 'default' })}
          disabled={!canContinue}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
