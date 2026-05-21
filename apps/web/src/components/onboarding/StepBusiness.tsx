'use client';

import { useState } from 'react';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onNext: (data: Pick<OnboardingData, 'businessName' | 'businessType' | 'phone'>) => void;
  onBack: () => void;
}

const BUSINESS_TYPES = [
  { id: 'retail', label: 'Tienda / Ropa', icon: '🛍️' },
  { id: 'food', label: 'Restaurante / Café', icon: '🍽️' },
  { id: 'supermarket', label: 'Supermercado', icon: '🛒' },
  { id: 'services', label: 'Servicios', icon: '🔧' },
  { id: 'pharmacy', label: 'Farmacia', icon: '💊' },
  { id: 'other', label: 'Otro', icon: '✨' },
] as const;

export function StepBusiness({ data, onNext, onBack }: Props) {
  const [businessName, setBusinessName] = useState(data.businessName ?? '');
  const [businessType, setBusinessType] = useState(data.businessType ?? '');
  const [phone, setPhone] = useState(data.phone ?? '');

  const canContinue = businessName.trim().length >= 2 && businessType !== '' && phone.trim().length >= 7;

  return (
    <div>
      <h2
        className="text-2xl font-display font-semibold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        Tu negocio
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Cuéntanos un poco sobre tu empresa.
      </p>

      {/* Business type */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
          Tipo de negocio *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {BUSINESS_TYPES.map((t) => {
            const isSelected = businessType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setBusinessType(t.id)}
                className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 text-center transition-all"
                style={{
                  border: isSelected
                    ? '2px solid var(--gold-500)'
                    : '2px solid var(--border-default)',
                  background: isSelected ? 'var(--gold-50)' : 'var(--bg-surface)',
                  boxShadow: isSelected ? 'var(--shadow-gold)' : 'none',
                }}
              >
                <span className="text-xl">{t.icon}</span>
                <span
                  className="text-xs font-medium leading-tight"
                  style={{ color: isSelected ? 'var(--gold-700)' : 'var(--text-secondary)' }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Business name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Nombre del negocio *
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Ej: Arepas El Mono"
          maxLength={80}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
          style={{
            border: '1.5px solid var(--border-default)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      {/* Phone */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
          Teléfono del negocio *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej: 3001234567"
          maxLength={15}
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
          style={{
            border: '1.5px solid var(--border-default)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            border: '1.5px solid var(--border-default)',
            color: 'var(--text-secondary)',
            background: 'transparent',
          }}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={() => onNext({ businessName: businessName.trim(), businessType, phone: phone.trim() })}
          disabled={!canContinue}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: 'var(--text-primary)', color: '#F7F6F3' }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
