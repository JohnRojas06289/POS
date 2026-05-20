'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      tenantName: formData.get('tenantName'),
      ownerName: formData.get('ownerName'),
      email: formData.get('email'),
      password: formData.get('password'),
      country: 'CO',
      timezone: 'America/Bogota',
      currency: 'COP',
      businessType: 'retail',
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al registrar');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow">
          <div className="mb-4 text-6xl">✅</div>
          <h2 className="mb-2 text-xl font-bold text-green-600">¡Tienda creada!</h2>
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow"
      >
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Crear tu tienda</h1>
        
        {error && (
          <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre de tu tienda
            </label>
            <input
              name="tenantName"
              type="text"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Mi Tienda"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tu nombre
            </label>
            <input
              name="ownerName"
              type="text"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="juan@mitienda.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear tienda'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </a>
        </p>
      </form>
    </div>
  );
}