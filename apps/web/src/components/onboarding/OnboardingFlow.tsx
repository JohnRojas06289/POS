'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StepPlans } from './StepPlans';
import { StepBusiness } from './StepBusiness';
import { StepAccount } from './StepAccount';
import { StepPayment } from './StepPayment';

export interface OnboardingData {
  planId: string;
  planName: string;
  planPrice: number;
  businessName: string;
  schemaName: string;
  phone: string;
  templateId: string;
  email: string;
  password: string;
  tenantId?: string;
  requiresPayment?: boolean;
}

const STEPS = ['plan', 'business', 'account', 'payment'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, string> = {
  plan: 'Plan',
  business: 'Negocio',
  account: 'Cuenta',
  payment: 'Pago',
};

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentStep = (searchParams.get('step') as Step) ?? 'plan';
  const [data, setData] = useState<Partial<OnboardingData>>({});

  const goTo = (step: Step) => router.push(`/onboarding?step=${step}`);
  const update = (partial: Partial<OnboardingData>) => setData((prev) => ({ ...prev, ...partial }));
  const stepIndex = STEPS.indexOf(currentStep);

  return (
    <div className="w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  i <= stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 ${i < stepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {STEPS.map((s) => <span key={s}>{STEP_LABELS[s]}</span>)}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-8">
        {currentStep === 'plan' && (
          <StepPlans
            selected={data.planId}
            onNext={(d) => { update(d); goTo('business'); }}
          />
        )}
        {currentStep === 'business' && (
          <StepBusiness
            data={data}
            onNext={(d) => { update(d); goTo('account'); }}
            onBack={() => goTo('plan')}
          />
        )}
        {currentStep === 'account' && (
          <StepAccount
            data={data}
            onNext={(d) => { update(d); goTo('payment'); }}
            onBack={() => goTo('business')}
          />
        )}
        {currentStep === 'payment' && (
          <StepPayment data={data} onBack={() => goTo('account')} />
        )}
      </div>
    </div>
  );
}
