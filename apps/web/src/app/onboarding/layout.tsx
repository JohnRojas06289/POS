import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comenzar — NEXUS POS',
  description: 'Crea tu cuenta y empieza a vender hoy',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
