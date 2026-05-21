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
  if (score >= 4) return '#34D399';
  if (score >= 3) return '#C9A84C';
  return '#F09595';
}

const inputStyle = {
  border: '1.5px solid rgba(255,255,255,0.1)',
  background: '#161616',
  color: 'rgba(242,240,235,0.9)',
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
      <h2 className="mb-1 text-2xl font-medium tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
        Crea tu cuenta
      </h2>
      <p className="mb-8 text-sm text-white/45">
        Serás el administrador principal del negocio.
      </p>

      <div className="space-y-4 mb-8">
        {/* Owner name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            Tu nombre completo *
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Ej: Carlos Gómez"
            maxLength={80}
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white/90 outline-none transition-all placeholder:text-white/20"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#C9A84C')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            Correo electrónico *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@minegocio.co"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white/90 outline-none transition-all placeholder:text-white/20"
            style={{
              ...inputStyle,
              borderColor: email && !emailValid ? '#F09595' : 'rgba(255,255,255,0.1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = email && !emailValid ? '#F09595' : '#C9A84C';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = email && !emailValid ? '#F09595' : 'rgba(255,255,255,0.1)';
            }}
          />
          {email && !emailValid && (
            <p className="mt-1 text-xs text-[#F09595]">Ingresa un correo válido</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            Contraseña *
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg px-3 py-2.5 pr-20 text-sm text-white/90 outline-none transition-all placeholder:text-white/20"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#C9A84C]"
            >
              {showPass ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Seguridad</span>
                <span className="font-semibold" style={{ color: strengthColor(score) }}>
                  {strengthLabel(score)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(score / 5) * 100}%`, background: strengthBg(score) }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            Confirmar contraseña *
          </label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repite tu contraseña"
            className="w-full rounded-lg px-3 py-2.5 text-sm text-white/90 outline-none transition-all placeholder:text-white/20"
            style={{
              ...inputStyle,
              borderColor: confirm && !match ? '#F09595' : 'rgba(255,255,255,0.1)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = confirm && !match ? '#F09595' : '#C9A84C';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = confirm && !match ? '#F09595' : 'rgba(255,255,255,0.1)';
            }}
          />
          {confirm && !match && (
            <p className="mt-1 text-xs text-[#F09595]">Las contraseñas no coinciden</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl py-3 text-sm font-medium text-white/50 transition-all hover:text-white/80"
          style={{ border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent' }}
        >
          ← Atrás
        </button>
        <button
          type="button"
          onClick={() => onNext({ ownerName: ownerName.trim(), email: email.trim(), password })}
          disabled={!canContinue}
          className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: '#C9A84C', color: '#0A0A0A' }}
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
