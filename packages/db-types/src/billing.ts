export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  billingCycle: string;
  maxBranches: number;
  maxUsers: number;
  features: Record<string, unknown>;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'pending' | 'active' | 'cancelled' | 'past_due';
  wompiReference: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  plan?: Plan;
}

export interface CheckoutSession {
  checkoutUrl: string;
  reference: string;
}

export interface OnboardingResult {
  tenantId: string;
  schemaName: string;
  requiresPayment: boolean;
}
