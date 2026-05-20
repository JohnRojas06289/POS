import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comenzar — NEXUS POS',
  description: 'Crea tu cuenta y empieza a vender hoy',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="px-6 py-4">
        <span className="text-2xl font-bold text-blue-700">NEXUS POS</span>
      </header>
      <main className="flex items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
