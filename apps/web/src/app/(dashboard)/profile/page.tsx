'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Mail, Shield, Store } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { authApi } from '../../../lib/api';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-default)] py-3 last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
    retry: false,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Perfil</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Tu acceso, tenant y contexto de trabajo.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card variant="default" padding="lg" className="lg:col-span-1">
          {isLoading ? (
            <Skeleton variant="card" />
          ) : (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--gold-500)] text-2xl font-semibold text-[#1A1400]">
                {(data?.name ?? data?.email ?? 'N').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{data?.name ?? 'Usuario'}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{data?.role ?? 'Sin rol'}</p>
              </div>
              <Link href="/settings" className="inline-flex rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]">
                Ir a configuración
              </Link>
            </div>
          )}
        </Card>

        <Card variant="default" padding="lg" className="lg:col-span-2">
          {isLoading ? (
            <Skeleton variant="text" lines={6} />
          ) : data ? (
            <div className="space-y-1">
              <InfoRow label="Correo" value={data.email} />
              <InfoRow label="Tenant" value={data.tenant.name} />
              <InfoRow label="Sucursal" value={data.branch?.name ?? 'Sin sucursal'} />
              <InfoRow label="Schema" value={data.tenant.schemaName} />
              <InfoRow label="Terminal" value={data.terminalId ?? 'Sin terminal'} />
            </div>
          ) : null}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card variant="default" padding="lg">
          <Mail className="mb-3 text-[var(--text-gold)]" size={18} />
          <p className="text-sm text-[var(--text-secondary)]">Email</p>
          <p className="mt-1 font-medium text-[var(--text-primary)]">{data?.email ?? '—'}</p>
        </Card>
        <Card variant="default" padding="lg">
          <Store className="mb-3 text-[var(--text-gold)]" size={18} />
          <p className="text-sm text-[var(--text-secondary)]">Negocio</p>
          <p className="mt-1 font-medium text-[var(--text-primary)]">{data?.tenant.name ?? '—'}</p>
        </Card>
        <Card variant="default" padding="lg">
          <Shield className="mb-3 text-[var(--text-gold)]" size={18} />
          <p className="text-sm text-[var(--text-secondary)]">Rol</p>
          <p className="mt-1 font-medium text-[var(--text-primary)]">{data?.role ?? '—'}</p>
        </Card>
      </div>
    </div>
  );
}
