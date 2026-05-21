'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Building2 } from 'lucide-react';
import { Badge, Button, Card } from '../../../components/ui';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { authApi } from '../../../lib/api';

function getErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { data?: unknown } })?.response;
  const data = response?.data as { message?: unknown; error?: unknown } | string | undefined;

  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (Array.isArray(data.message)) {
    return data.message.filter((item): item is string => typeof item === 'string').join(', ') || fallback;
  }
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return fallback;
}

export default function ForgotPasswordPage() {
  const [tenantEmail, setTenantEmail] = useState('demo@nexus.com');
  const [email, setEmail] = useState('demo@nexus.com');
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetLink(null);

    try {
      const res = await authApi.requestPasswordReset({ tenantEmail, email });
      setMessage(res.message ?? 'Revisa tu correo para continuar.');
      setResetLink(res.resetLink ?? null);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos generar el enlace de recuperación.'));
    } finally {
      setLoading(false);
    }
  }

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
              <Badge variant="gold">Recuperación de acceso</Badge>
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-5xl font-medium leading-[0.95] tracking-tight text-white">
                Volver a entrar sin perder el contexto del negocio.
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/72">
                Pide un enlace temporal para restablecer tu contraseña. El flujo valida el tenant y la cuenta antes de generar el acceso.
              </p>
            </div>
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
              <Badge variant="gold">Recuperar contraseña</Badge>
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-medium tracking-tight text-[var(--text-primary)]">
                Solicitar enlace
              </h1>
            </div>

            <Card className="p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <ArrowLeft size={16} />
                <Link href="/login" className="font-medium text-[var(--text-primary)] underline decoration-[var(--gold-500)] underline-offset-4">
                  Volver al login
                </Link>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    <span className="text-[var(--text-gold)]" aria-hidden><Building2 size={14} /></span>
                    Email del negocio
                  </span>
                  <input
                    type="email"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="demo@nexus.com"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    <span className="text-[var(--text-gold)]" aria-hidden><Mail size={14} /></span>
                    Tu email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="owner@negocio.co"
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]"
                  />
                </label>

                {error && (
                  <div className="rounded-[var(--radius-md)] border border-[var(--danger-text)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger-text)]">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                    <p className="font-medium">{message}</p>
                    {resetLink && (
                      <a href={resetLink} className="mt-2 inline-block underline underline-offset-4">
                        Abrir enlace de recuperación
                      </a>
                    )}
                  </div>
                )}

                <Button type="submit" loading={loading} fullWidth size="lg" variant="gold">
                  {loading ? 'Generando enlace...' : 'Enviar enlace de recuperación'}
                </Button>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
