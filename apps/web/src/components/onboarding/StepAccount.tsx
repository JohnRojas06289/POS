'use client';

import { useState } from 'react';
import type { OnboardingData } from './OnboardingFlow';

interface Props {
  data: Partial<OnboardingData>;
  onNext: (data: Pick<OnboardingData, 'ownerName' | 'email' | 'password'>) => void;
  onBack: () => void;
}

function strengthScore(password: string): number {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

function strengthLabel(score: number): string {
  if (score >= 5) return 'Muy fuerte';
  if (score >= 4) return 'Fuerte';
  if (score >= 3) return 'Media';
  if (score >= 2) return 'Débil';
  return 'Muy débil';
}

function strengthColor(score: number): string {
  if (score >= 4) return 'var(--success-text)';
  if (score >= 3) return 'var(--warning-text)';
  return 'var(--danger-text)';
}

function strengthBg(score: number): string {
  if (score >= 4) return 'var(--success-text)';
  if (score >= 3) return 'var(--gold-500)';
  return 'var(--danger-text)';
}

const inputStyle = {
  border: '1.5px solid var(--border-default)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
};

export function StepAccount({ data, onNext, onBack }: Props) {
  const [ownerName, setOwnerName] = useState(data.ownerName ?? '');
  const [email, setEmail] = useState(data.email ?? '');
  const [password, setPassword] = useState(data.password ?? '');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passValid = password.length >= 8;
  const match = password === confirm;
  const score = password ? strengthScore(password) : 0;
  const canContinue = ownerName.trim().length >= 2 && emailValid && passValid && match;

  return (
    <div>
      <h2
        className="text-2xl font-display font-semibold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        Crea tu cuenta
      </h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Serás el administrador principal del negocio.
      </p>

      <div className="space-y-4 mb-8">
        {/* Owner name */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Tu nombre completo *
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Ej: Carlos Gómez"
            maxLength={80}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Correo electrónico *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@minegocio.co"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
            style={{
              ...inputStyle,
              borderColor: email && !emailValid ? 'var(--danger-text)' : 'var(--border-default)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor =
                email && !emailValid ? 'var(--danger-text)' : 'var(--gold-500)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor =
                email && !emailValid ? 'var(--danger-text)' : 'var(--border-default)';
            }}
          />
          {email && !emailValid && (
            <p className="text-xs mt-1" style={{ color: 'var(--danger-text)' }}>
              Ingresa un correo válido
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Contraseña *
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg px-3 py-2.5 pr-20 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
              style={{ color: 'var(--gold-600)' }}
            >
              {showPass ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-tertiary)' }}>Seguridad</span>
                <span className="font-semibold" style={{ color: strengthColor(score) }}>
                  {strengthLabel(score)}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-muted)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(score / 5) * 100}%`,
                    background: strengthBg(score),
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Confirmar contraseña *
          </label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite tu contraseña"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
            style={{
              ...inputStyle,
              borderColor: confirm && !match ? 'var(--danger-text)' : 'var(--border-default)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor =
                confirm && !match ? 'var(--danger-text)' : 'var(--gold-500)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor =
                confirm && !match ? 'var(--danger-text)' : 'var(--border-default)';
            }}
          />
          {confirm && !match && (
            <p className="text-xs mt-1" style={{ color: 'var(--danger-text)' }}>
              Las contraseñas no coinciden
            </p>
          )}
        </div>
      </div>

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
          onClick={() =>
            onNext({ ownerName: ownerName.trim(), email: email.trim(), password })
          }
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
