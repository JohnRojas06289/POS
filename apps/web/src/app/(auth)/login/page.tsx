'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Card } from '../../../components/ui';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { useAuthStore } from '../../../stores/auth.store';
import { cn } from '../../../lib/cn';
import { Building2, Eye, EyeOff, Lock, User } from 'lucide-react';
import type { ReactNode } from 'react';

type Tab = 'email' | 'pin';

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        <span className="text-[var(--text-gold)]" aria-hidden>{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginPin, isLoading, error, clearError } = useAuthStore();

  const [tab, setTab] = useState<Tab>('email');
  const [tenantEmail, setTenantEmail] = useState('demo@nexus.com');
  const [email, setEmail] = useState('demo@nexus.com');
  const [password, setPassword] = useState('demo1234');
  const [tenantId, setTenantId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setSlowRequest(false);
    const timer = setTimeout(() => setSlowRequest(true), 4000);
    try {
      await login(email, password, tenantEmail);
      clearTimeout(timer);
      router.push('/dashboard');
    } catch {
      clearTimeout(timer);
      setSlowRequest(false);
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await loginPin(pin, tenantId, branchId);
      router.push('/dashboard');
    } catch {
      // error handled by store
    }
  }

  const handlePinKey = (digit: string) => {
    if (digit === '⌫') {
      setPin((current) => current.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((current) => current + digit);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.15),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(201,168,76,0.08),transparent_28%),var(--bg-base)] px-4 py-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[28px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="relative hidden overflow-hidden bg-[#0A0A0A] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-medium tracking-tight text-[var(--text-gold)]">
                  NEXUS
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/40">Premium POS</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="mt-16 max-w-md space-y-6">
              <Badge variant="gold">Editorial commerce</Badge>
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-5xl font-medium leading-[0.95] tracking-tight text-white">
                Un login que se siente premium desde el primer segundo.
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/72">
                Acceso rápido para el equipo, con tipografía editorial, contraste alto y controles claros para operar sin fricción.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            {[
              ['Rapidez', 'Acceso inmediato'],
              ['Claridad', 'UX directa'],
              ['Confianza', 'Diseño consistente'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-[20px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div>
                <p style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-medium tracking-tight text-[var(--text-primary)]">
                  NEXUS
                </p>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Premium POS</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="mb-8 space-y-2 lg:hidden">
              <Badge variant="gold">Acceso al sistema</Badge>
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-medium tracking-tight text-[var(--text-primary)]">
                Ingresar
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">Usa tus credenciales para continuar al POS.</p>
            </div>

            <Card className="p-6 sm:p-8">
              <div className="mb-6 flex rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] p-1">
                {(['email', 'pin'] as Tab[]).map((currentTab) => (
                  <button
                    key={currentTab}
                    onClick={() => {
                      setTab(currentTab);
                      clearError();
                    }}
                    className={cn(
                      'flex-1 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      tab === currentTab
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {currentTab === 'email' ? 'Email' : 'PIN Cajero'}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--danger-text)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]">
                  <p className="mb-1 font-medium">No pudimos iniciar sesión</p>
                  <p className="leading-6">{error}</p>
                </div>
              )}

              {tab === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Field label="Email del negocio" icon={<Building2 size={14} />}>
                    <input
                      type="email"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder="demo@nexus.com"
                      required
                      autoComplete="email"
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]"
                    />
                  </Field>

                  <Field label="Tu email" icon={<User size={14} />}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="demo@nexus.com"
                      required
                      autoComplete="username"
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]"
                    />
                  </Field>

                  <Field label="Contraseña" icon={<Lock size={14} />}>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="current-password"
                        className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 pr-12 text-sm text-[var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>

                  <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span>Acceso demo precargado para pruebas.</span>
                    <span className="font-mono-data">Ctrl + K en app</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                    <span>¿Perdiste acceso?</span>
                    <Link href="/forgot-password" className="font-medium text-[var(--text-primary)] underline decoration-[var(--gold-500)] underline-offset-4">
                      Recuperar contraseña
                    </Link>
                  </div>

                  {slowRequest && isLoading && (
                    <div className="rounded-[var(--radius-md)] border border-[var(--gold-500)]/30 bg-[var(--gold-500)]/8 px-4 py-3 text-xs text-[var(--text-secondary)]">
                      <p className="font-medium text-[var(--text-gold)]">El servidor está iniciando…</p>
                      <p className="mt-0.5">El servidor gratuito tarda hasta 60 s en despertar. Espera un momento.</p>
                    </div>
                  )}

                  <Button type="submit" loading={isLoading} fullWidth size="lg" variant="gold" className="mt-2">
                    {isLoading ? 'Ingresando...' : 'Entrar al POS'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <Field label="ID del tenant" icon={<Building2 size={14} />}>
                    <input
                      type="text"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="tenant-uuid"
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]"
                    />
                  </Field>

                  <Field label="ID de la sucursal" icon={<Building2 size={14} />}>
                    <input
                      type="text"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      placeholder="branch-uuid"
                      required
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]"
                    />
                  </Field>

                  <div className="flex justify-center gap-3 py-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={cn(
                          'h-4 w-4 rounded-full border-2 transition-colors',
                          pin.length > index ? 'border-[var(--gold-500)] bg-[var(--gold-500)]' : 'border-[var(--border-strong)]',
                        )}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => (
                      <button
                        key={key}
                        type={key === '✓' ? 'submit' : 'button'}
                        onClick={key !== '✓' ? () => handlePinKey(key) : undefined}
                        disabled={isLoading || (key === '✓' && pin.length !== 4)}
                        className={cn(
                          'rounded-[var(--radius-md)] py-3 text-lg font-medium transition-all duration-150',
                          key === '✓'
                            ? 'bg-[var(--gold-500)] text-[#1A1400] hover:bg-[var(--gold-400)] disabled:cursor-not-allowed disabled:opacity-40'
                            : key === '⌫'
                            ? 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]',
                        )}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </form>
              )}
            </Card>

            <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
              Diseñado para operación diaria. Claro, rápido y confiable.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
