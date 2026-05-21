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
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="text-sm text-white/30">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      {/* Left panel — brand */}
      <div className="relative hidden lg:flex lg:w-[400px] xl:w-[460px] flex-shrink-0 flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#111111] p-12">
        {/* Ambient grid */}
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-[300px] w-[300px] bg-[radial-gradient(ellipse,rgba(201,168,76,0.08),transparent_65%)]" />

        <div className="relative">
          <div className="mb-14">
            <p className="text-2xl font-medium tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
              NEXUS
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/30">Premium POS</p>
          </div>

          <h1 className="text-4xl font-medium leading-tight tracking-tight text-white mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            Tu negocio en marcha{' '}
            <span className="text-shimmer">en minutos.</span>
          </h1>

          <p className="text-sm leading-7 text-white/45 mb-10">
            NEXUS POS es el sistema de punto de venta diseñado para negocios colombianos que quieren vender más y administrar mejor.
          </p>

          <div className="space-y-5">
            {[
              { title: 'Configuración en minutos', desc: 'Sin técnicos, sin manuales. Selecciona tu tipo de negocio y empieza.' },
              { title: 'Offline cuando lo necesitas', desc: 'La caja sigue funcionando sin internet y sincroniza sola.' },
              { title: 'Reportes que se leen solos', desc: 'Ventas, inventario y clientes en un solo panel.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.08)]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90 mb-0.5">{f.title}</p>
                  <p className="text-sm text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/20">
          © {new Date().getFullYear()} NEXUS POS · Colombia
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex min-h-screen flex-1 flex-col overflow-y-auto">
        {/* Mobile header */}
        <div className="flex items-center border-b border-white/[0.06] bg-[#111111] px-6 py-4 lg:hidden">
          <p className="text-lg font-medium tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            NEXUS <span className="text-[#C9A84C]">POS</span>
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Stepper */}
            <div className="mb-10">
              <div className="mb-3 flex items-center">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all"
                      style={
                        i < stepIndex
                          ? { background: '#C9A84C', color: '#0A0A0A' }
                          : i === stepIndex
                          ? { background: '#F2F0EB', color: '#0A0A0A' }
                          : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
                      }
                    >
                      {i < stepIndex ? '✓' : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="mx-2 h-0.5 flex-1 transition-all"
                        style={{ background: i < stepIndex ? '#C9A84C' : 'rgba(255,255,255,0.08)' }}
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
                    style={{ color: i === stepIndex ? '#F2F0EB' : 'rgba(255,255,255,0.3)' }}
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
          <span className="text-xs text-white/30">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="font-medium text-[#C9A84C] underline decoration-[rgba(201,168,76,0.4)] underline-offset-3">
              Iniciar sesión
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
