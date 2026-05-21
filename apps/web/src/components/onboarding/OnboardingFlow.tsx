'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StepPlans } from './StepPlans';
import { StepBusiness } from './StepBusiness';
import { StepAccount } from './StepAccount';
import { StepConfirm } from './StepConfirm';
import { StepPayment } from './StepPayment';

export interface OnboardingData {
  planId: string;
  planName: string;
  planPrice: number;
  businessName: string;
  businessType: string;
  phone: string;
  ownerName: string;
  email: string;
  password: string;
}

const STEPS = ['plan', 'business', 'account', 'confirm', 'payment'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, string> = {
  plan: 'Plan',
  business: 'Negocio',
  account: 'Cuenta',
  confirm: 'Confirmar',
  payment: 'Pago',
};

const STORAGE_KEY = 'nexus-onboarding-v2';

function loadStoredData(): Partial<OnboardingData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<OnboardingData>) : {};
  } catch {
    return {};
  }
}

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = (searchParams.get('step') as Step) ?? 'plan';
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(loadStoredData());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, hydrated]);

  const goTo = (step: Step) => router.push(`/onboarding?step=${step}`);
  const update = (partial: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));
  const stepIndex = STEPS.indexOf(currentStep);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 flex-shrink-0"
        style={{ background: 'var(--text-primary)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-16">
            <span
              className="text-xl font-display font-semibold tracking-tight"
              style={{ color: 'var(--gold-400)' }}
            >
              NEXUS POS
            </span>
          </div>

          <h1
            className="text-4xl font-display leading-tight mb-6"
            style={{ color: '#F7F6F3' }}
          >
            Tu negocio en marcha en{' '}
            <span style={{ color: 'var(--gold-400)' }}>minutos</span>
          </h1>

          <p className="text-base leading-relaxed mb-12" style={{ color: '#8A887F' }}>
            NEXUS POS es el sistema de punto de venta diseñado para negocios colombianos que quieren
            vender más y administrar mejor.
          </p>

          <div className="space-y-5">
            {[
              { icon: '⚡', title: 'Listo al instante', desc: 'Tu tienda lista en menos de 2 minutos.' },
              { icon: '🔒', title: 'Seguro y confiable', desc: 'Datos encriptados, backups automáticos.' },
              { icon: '📊', title: 'Reportes en tiempo real', desc: 'Ventas, inventario y clientes en un solo lugar.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#F7F6F3' }}>
                    {f.title}
                  </p>
                  <p className="text-sm" style={{ color: '#8A887F' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: '#4A4844' }}>
          © {new Date().getFullYear()} NEXUS POS · Colombia
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Mobile header */}
        <div
          className="lg:hidden flex items-center px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}
        >
          <span
            className="text-lg font-display font-semibold"
            style={{ color: 'var(--gold-500)' }}
          >
            NEXUS POS
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Stepper */}
            <div className="mb-10">
              <div className="flex items-center mb-3">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all"
                      style={
                        i < stepIndex
                          ? { background: 'var(--gold-500)', color: '#fff' }
                          : i === stepIndex
                          ? { background: 'var(--text-primary)', color: '#fff' }
                          : { background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }
                      }
                    >
                      {i < stepIndex ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mx-2 transition-all"
                        style={{
                          background:
                            i < stepIndex ? 'var(--gold-500)' : 'var(--bg-muted)',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                {STEPS.map((s, i) => (
                  <span
                    key={s}
                    className="text-xs font-medium transition-colors"
                    style={{
                      color:
                        i === stepIndex
                          ? 'var(--text-primary)'
                          : 'var(--text-tertiary)',
                    }}
                  >
                    {STEP_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>

            {/* Step content */}
            {currentStep === 'plan' && (
              <StepPlans
                selected={data.planId}
                onNext={(d) => {
                  update(d);
                  goTo('business');
                }}
              />
            )}
            {currentStep === 'business' && (
              <StepBusiness
                data={data}
                onNext={(d) => {
                  update(d);
                  goTo('account');
                }}
                onBack={() => goTo('plan')}
              />
            )}
            {currentStep === 'account' && (
              <StepAccount
                data={data}
                onNext={(d) => {
                  update(d);
                  goTo('confirm');
                }}
                onBack={() => goTo('business')}
              />
            )}
            {currentStep === 'confirm' && (
              <StepConfirm
                data={data}
                onBack={() => goTo('account')}
                onPay={() => goTo('payment')}
              />
            )}
            {currentStep === 'payment' && (
              <StepPayment data={data} onBack={() => goTo('confirm')} />
            )}
          </div>
        </div>

        <div className="pb-8 text-center">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            ¿Ya tienes cuenta?{' '}
            <a
              href="/login"
              className="font-medium underline"
              style={{ color: 'var(--gold-600)' }}
            >
              Iniciar sesión
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
