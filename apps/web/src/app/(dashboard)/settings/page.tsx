'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Save, AlertTriangle, Building2, ShoppingCart, Users, MapPin, FileText, Shield } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { tenantsApi } from '../../../lib/api';
import { cn } from '../../../lib/cn';

function Section({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card variant="default" padding="none">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[--bg-secondary] transition-colors rounded-[--radius-lg]"
      >
        <div className="flex items-center gap-3">
          <span className="text-[--nexus-500]">{icon}</span>
          <span className="font-semibold text-[--text-primary]">{title}</span>
        </div>
        {open ? <ChevronUp size={18} className="text-[--text-tertiary]" /> : <ChevronDown size={18} className="text-[--text-tertiary]" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-[--border]">{children}</div>}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[--text-secondary] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500] transition-colors"
    />
  );
}

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Nequi', 'Daviplata', 'Transferencia'];

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeMethods, setActiveMethods] = useState<string[]>(['Efectivo', 'Tarjeta débito', 'Nequi']);

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['tenant-config'],
    queryFn: tenantsApi.getConfig,
    retry: false,
  });

  const { data: branches, isLoading: loadingBranches } = useQuery({
    queryKey: ['tenant-branches'],
    queryFn: tenantsApi.getBranches,
    retry: false,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['tenant-users'],
    queryFn: tenantsApi.getUsers,
    retry: false,
  });

  const handleSave = () => {
    toast('Configuración guardada', 'success');
  };

  const toggleMethod = (m: string) => {
    setActiveMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Configuración</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">Ajusta tu negocio, POS y equipo</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
        >
          <Save size={16} /> Guardar cambios
        </button>
      </div>

      {/* Información del negocio */}
      <Section title="Información del negocio" icon={<Building2 size={18} />} defaultOpen>
        {loadingConfig ? (
          <div className="pt-4 space-y-4"><Skeleton variant="text" lines={4} /></div>
        ) : (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre del negocio">
              <TextInput defaultValue={(config as { name?: string })?.name ?? ''} placeholder="Mi Negocio S.A.S." />
            </Field>
            <Field label="NIT">
              <TextInput defaultValue={(config as { nit?: string })?.nit ?? ''} placeholder="900.123.456-7" />
            </Field>
            <Field label="WhatsApp">
              <TextInput defaultValue={(config as { whatsapp?: string })?.whatsapp ?? ''} placeholder="+57 300 123 4567" />
            </Field>
            <Field label="Ciudad">
              <TextInput defaultValue={(config as { city?: string })?.city ?? ''} placeholder="Bogotá, Colombia" />
            </Field>
          </div>
        )}
      </Section>

      {/* Configuración del POS */}
      <Section title="Configuración del POS" icon={<ShoppingCart size={18} />}>
        <div className="pt-4 space-y-4">
          <Field label="Plantilla de negocio">
            <select className="w-full px-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]">
              <option>Restaurante</option>
              <option>Tienda de ropa</option>
              <option>Minimercado</option>
              <option>Papelería</option>
              <option>Otro</option>
            </select>
          </Field>
          <Field label="Métodos de pago activos">
            <div className="flex flex-wrap gap-2 mt-1">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMethod(m)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-full border transition-all',
                    activeMethods.includes(m)
                      ? 'bg-[--nexus-500] text-white border-[--nexus-500]'
                      : 'bg-[--bg-primary] text-[--text-secondary] border-[--border] hover:border-[--nexus-500]',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Impuestos">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-[--nexus-500]" />
              <span className="text-sm text-[--text-primary]">IVA 19% habilitado</span>
            </label>
          </Field>
        </div>
      </Section>

      {/* Usuarios y roles */}
      <Section title="Usuarios y roles" icon={<Users size={18} />}>
        {loadingUsers ? (
          <div className="pt-4"><Skeleton variant="table-row" /><Skeleton variant="table-row" /></div>
        ) : (
          <div className="pt-4">
            {Array.isArray(users) && users.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[--text-tertiary] border-b border-[--border]">
                    <th className="pb-2 font-medium">Usuario</th>
                    <th className="pb-2 font-medium">Rol</th>
                    <th className="pb-2 font-medium">Sucursal</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--border]">
                  {(users as Array<{ id: string; name: string; email: string; role: string; branch?: string; isActive?: boolean }>).map(u => (
                    <tr key={u.id}>
                      <td className="py-2.5">
                        <p className="font-medium text-[--text-primary]">{u.name}</p>
                        <p className="text-xs text-[--text-tertiary]">{u.email}</p>
                      </td>
                      <td className="py-2.5 capitalize text-[--text-secondary]">{u.role}</td>
                      <td className="py-2.5 text-[--text-secondary]">{u.branch ?? '—'}</td>
                      <td className="py-2.5">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-[--bg-tertiary] text-[--text-tertiary]')}>
                          {u.isActive !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[--text-tertiary] py-4 text-center">No hay usuarios configurados</p>
            )}
          </div>
        )}
      </Section>

      {/* Sucursales */}
      <Section title="Sucursales" icon={<MapPin size={18} />}>
        {loadingBranches ? (
          <div className="pt-4"><Skeleton variant="text" lines={3} /></div>
        ) : (
          <div className="pt-4 space-y-3">
            {Array.isArray(branches) && branches.length > 0 ? (
              (branches as Array<{ id: string; name: string; address?: string; isMain?: boolean }>).map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-[--bg-secondary] rounded-[--radius-md]">
                  <div>
                    <p className="font-medium text-[--text-primary] text-sm">{b.name}</p>
                    <p className="text-xs text-[--text-tertiary] mt-0.5">{b.address ?? 'Sin dirección'}</p>
                  </div>
                  {b.isMain && <span className="text-xs bg-[--nexus-500]/10 text-[--nexus-500] px-2 py-0.5 rounded-full">Principal</span>}
                </div>
              ))
            ) : (
              <p className="text-sm text-[--text-tertiary] py-4 text-center">No hay sucursales configuradas</p>
            )}
          </div>
        )}
      </Section>

      {/* DIAN */}
      <Section title="DIAN — Facturación electrónica" icon={<FileText size={18} />}>
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prefijo de factura">
            <TextInput placeholder="SETP" />
          </Field>
          <Field label="Número de resolución">
            <TextInput placeholder="18764000001" />
          </Field>
          <Field label="Rango desde">
            <TextInput placeholder="1" />
          </Field>
          <Field label="Rango hasta">
            <TextInput placeholder="5000000" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Certificado digital (.p12)">
              <div className="border-2 border-dashed border-[--border] rounded-[--radius-md] px-4 py-6 text-center">
                <p className="text-sm text-[--text-tertiary]">Arrastra tu certificado o haz clic para subir</p>
                <button className="mt-2 text-xs text-[--nexus-500] hover:underline">Seleccionar archivo</button>
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* Peligro */}
      <Section title="Zona de peligro" icon={<Shield size={18} />}>
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between p-4 border border-[--border] rounded-[--radius-md]">
            <div>
              <p className="text-sm font-medium text-[--text-primary]">Cambiar contraseña</p>
              <p className="text-xs text-[--text-tertiary] mt-0.5">Actualiza tu contraseña de acceso</p>
            </div>
            <button className="px-3 py-1.5 text-sm border border-[--border] rounded-[--radius-md] text-[--text-secondary] hover:border-[--nexus-500] hover:text-[--nexus-500] transition-colors">
              Cambiar
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/40 rounded-[--radius-md] bg-red-50 dark:bg-red-900/10">
            <div>
              <p className="text-sm font-medium text-[--danger] flex items-center gap-1.5"><AlertTriangle size={14} /> Cerrar sesión en todos los dispositivos</p>
              <p className="text-xs text-[--text-tertiary] mt-0.5">Invalida todos los tokens activos de tu cuenta</p>
            </div>
            <button className="px-3 py-1.5 text-sm bg-[--danger] text-white rounded-[--radius-md] hover:bg-red-600 transition-colors">
              Cerrar todas
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
