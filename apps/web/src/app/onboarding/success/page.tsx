'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const params = useSearchParams();
  const payment = params.get('payment');

  if (payment === 'pending') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-10 text-center max-w-md">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago en proceso</h1>
        <p className="text-gray-500 mb-6">
          Tu cuenta fue creada. Una vez confirmemos el pago activaremos tu negocio.
          Revisa tu email para instrucciones.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-10 text-center max-w-md">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido a NEXUS!</h1>
      <p className="text-gray-500 mb-6">
        Tu cuenta fue creada exitosamente. Ya puedes iniciar sesión y comenzar a vender.
      </p>
      <Link
        href="/login"
        className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
      >
        Ir al inicio de sesión
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
