import { Suspense } from 'react';
import { OnboardingFlow } from '../../../components/onboarding/OnboardingFlow';

export default function RegisterPage() {
  return (
    <Suspense>
      <OnboardingFlow />
    </Suspense>
  );
}
