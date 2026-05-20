'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/auth.store';
import { cn } from '../../../lib/cn';

type Tab = 'email' | 'pin';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginPin, isLoading, error, clearError } = useAuthStore();

  const [tab, setTab] = useState<Tab>('email');
  const [tenantEmail, setTenantEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [pin, setPin] = useState('');

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password, tenantEmail);
      router.push('/pos');
    } catch {
      // error handled by store
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await loginPin(pin, tenantId, branchId);
      router.push('/pos');
    } catch {
      // error handled by store
    }
  }

  const handlePinKey = (digit: string) => {
    if (digit === '⌫') {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 4) {
      setPin((p) => p + digit);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">NEXUS POS</h1>
          <p className="text-gray-500 mt-1">Sistema de punto de venta</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            {(['email', 'pin'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); clearError(); }}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                  tab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {t === 'email' ? 'Email' : 'PIN Cajero'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {tab === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del negocio
                </label>
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  placeholder="negocio@ejemplo.com"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tu email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del tenant
                </label>
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="tenant-uuid"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de la sucursal
                </label>
                <input
                  type="text"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  placeholder="branch-uuid"
                  required
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* PIN display */}
              <div className="flex justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-4 h-4 rounded-full border-2 transition-colors',
                      pin.length > i
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-400',
                    )}
                  />
                ))}
              </div>
              {/* PIN keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map((k) => (
                  <button
                    key={k}
                    type={k === '✓' ? 'submit' : 'button'}
                    onClick={k !== '✓' ? () => handlePinKey(k) : undefined}
                    disabled={isLoading || (k === '✓' && pin.length !== 4)}
                    className={cn(
                      'py-3 rounded-lg text-lg font-medium transition-colors',
                      k === '✓'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'
                        : k === '⌫'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
