import { Suspense } from 'react';
import { OnboardingFlow } from '../../components/onboarding/OnboardingFlow';

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-500">Cargando...</div>}>
      <OnboardingFlow />
    </Suspense>
  );
}
