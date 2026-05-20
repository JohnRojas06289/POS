'use client';

import { useState } from 'react';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onNext: (data: Pick<OnboardingData, 'email' | 'password'>) => void;
  onBack: () => void;
}

export function StepAccount({ data, onNext, onBack }: Props) {
  const [email, setEmail] = useState(data.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passValid = password.length >= 8;
  const match = password === confirm;
  const canContinue = emailValid && passValid && match;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
      <p className="text-gray-500 mb-6">Serás el administrador del negocio.</p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@minegocio.co"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              email && !emailValid ? 'border-red-400' : ''
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border px-3 py-2.5 text-sm pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-2.5 text-xs text-blue-600 font-medium"
            >
              {showPass ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {password && !passValid && (
            <p className="text-xs text-red-500 mt-1">Mínimo 8 caracteres</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite tu contraseña"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              confirm && !match ? 'border-red-400' : ''
            }`}
          />
          {confirm && !match && (
            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
          )}
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
          onClick={() => onNext({ email, password })}
          disabled={!canContinue}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
