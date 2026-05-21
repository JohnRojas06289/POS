'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Save, AlertTriangle, Building2, ShoppingCart, MapPin, FileText, Shield, MonitorSmartphone, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { billingApi, tenantsApi } from '../../../lib/api';
import { cn } from '../../../lib/cn';
import { THEME_OPTIONS } from '../../../lib/themes';

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

function ThemeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{THEME_OPTIONS.map((themeOption) => <div key={themeOption.id} className="h-28 rounded-[--radius-lg] border border-[--border] bg-[--bg-primary]" />)}</div>;
  }

  const currentTheme = resolvedTheme ?? theme ?? 'minimal';

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {THEME_OPTIONS.map((option) => {
        const active = currentTheme === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={cn(
              'group rounded-[--radius-lg] border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[--shadow-md]',
              active
                ? 'border-[--nexus-500] bg-[rgba(201,168,76,0.08)] shadow-[--shadow-md]'
                : 'border-[--border] bg-[--bg-primary] hover:border-[--nexus-500]',
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[--radius-md] border border-[--border] bg-[--bg-secondary] text-[--text-secondary]">
                  <Palette size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[--text-primary]">{option.label}</p>
                  <p className="text-xs text-[--text-secondary]">{option.description}</p>
                </div>
              </div>
              {active && <span className="rounded-full bg-[--nexus-500] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Activo</span>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 rounded-[--radius-md] border border-black/10" style={{ background: option.surface }} />
              <div className="h-10 rounded-[--radius-md] border border-black/10" style={{ background: option.muted }} />
              <div className="h-10 rounded-[--radius-md] border border-black/10" style={{ background: option.accent }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PermissionMatrix({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (permissionId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map((group) => {
        const selectedCount = group.options.filter((option) => selected.includes(option.id)).length;
        const groupSelected = selectedCount === group.options.length && group.options.length > 0;
        const someSelected = selectedCount > 0 && !groupSelected;

        return (
          <div key={group.id} className="rounded-[--radius-lg] border border-[--border] bg-[--bg-primary] p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[--text-primary]">{group.title}</p>
                <p className="mt-0.5 text-xs text-[--text-secondary]">{group.description}</p>
              </div>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                groupSelected
                  ? 'bg-[--nexus-500] text-white'
                  : someSelected
                    ? 'bg-[rgba(201,168,76,0.12)] text-[--text-gold]'
                    : 'bg-[--bg-tertiary] text-[--text-tertiary]',
              )}>
                {selectedCount}/{group.options.length}
              </span>
            </div>

            <div className="space-y-2">
              {group.options.map((option) => {
                const active = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onToggle(option.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-[--radius-md] border p-3 text-left transition-colors',
                      active
                        ? 'border-[--nexus-500] bg-[rgba(201,168,76,0.08)]'
                        : 'border-[--border] bg-[var(--bg-secondary)] hover:border-[--nexus-500]',
                    )}
                  >
                    <span className={cn(
                      'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] border text-[10px] font-bold',
                      active ? 'border-[--nexus-500] bg-[--nexus-500] text-white' : 'border-[--border] text-transparent',
                    )}>
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[--text-primary]">{option.label}</p>
                        {option.importance === 'high' && (
                          <span className="rounded-full bg-[rgba(201,168,76,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[--text-gold]">Importante</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[--text-secondary]">{option.description}</p>
                      {option.route && <p className="mt-1 text-[11px] text-[--text-tertiary]">Ruta: {option.route}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Nequi', 'Daviplata', 'Transferencia'];

interface BillingPlanSummary {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  billingCycle: string;
  maxBranches: number;
  maxUsers: number;
}

interface SubscriptionSummary {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  plan: BillingPlanSummary | null;
}

interface TenantUserRow {
  id: string;
  isActive?: boolean;
}

type RoleConfig = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
};

type PermissionOption = {
  id: string;
  label: string;
  description: string;
  route?: string;
  importance?: 'high' | 'medium' | 'low';
};

type PermissionGroup = {
  id: string;
  title: string;
  description: string;
  options: PermissionOption[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Acceso a métricas, tarjetas y resumen operativo.',
    options: [
      { id: 'dashboard:read', label: 'Ver dashboard', description: 'Abre el resumen general del negocio.', route: '/dashboard', importance: 'high' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventario',
    description: 'Productos, variantes, stock y valuación.',
    options: [
      { id: 'inventory:read', label: 'Ver inventario', description: 'Consultar productos, existencias y kardex.', route: '/inventory' },
      { id: 'inventory:write', label: 'Editar inventario', description: 'Crear productos, ajustar stock y gestionar variantes.', route: '/inventory', importance: 'high' },
    ],
  },
  {
    id: 'orders',
    title: 'Órdenes y POS',
    description: 'Ventas, cobros y seguimiento de órdenes.',
    options: [
      { id: 'orders:read', label: 'Ver órdenes', description: 'Abrir historial y detalle de ventas.', route: '/orders' },
      { id: 'orders:write', label: 'Crear ventas', description: 'Cobrar, crear y suspender órdenes desde POS.', route: '/pos', importance: 'high' },
    ],
  },
  {
    id: 'customers',
    title: 'Clientes',
    description: 'Base de clientes, crédito y comportamiento.',
    options: [
      { id: 'customers:read', label: 'Ver clientes', description: 'Consultar clientes, deuda y compras.' },
    ],
  },
  {
    id: 'users',
    title: 'Usuarios y equipo',
    description: 'Personal, roles y acceso interno.',
    options: [
      { id: 'users:read', label: 'Ver usuarios', description: 'Listar equipo y revisar roles actuales.' },
      { id: 'users:write', label: 'Editar usuarios', description: 'Crear usuarios y ajustar sus accesos.', importance: 'high' },
    ],
  },
  {
    id: 'settings',
    title: 'Configuración',
    description: 'Ajustes del tenant, sucursales y terminales.',
    options: [
      { id: 'settings:write', label: 'Editar configuración', description: 'Cambiar ajustes globales del tenant.', importance: 'high' },
    ],
  },
];

const DEFAULT_ROLE_CONFIGS: RoleConfig[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Control total del negocio y configuración.',
    permissions: ['dashboard:read', 'inventory:write', 'orders:write', 'settings:write', 'users:write'],
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Administra operaciones y equipo.',
    permissions: ['dashboard:read', 'inventory:write', 'orders:read', 'users:read'],
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Opera la caja y las ventas del POS.',
    permissions: ['dashboard:read', 'orders:write', 'customers:read'],
  },
];

function NewBranchModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    try {
      await tenantsApi.createBranch({ name, address, phone });
      toast('Sucursal creada exitosamente', 'success');
      onSave();
    } catch {
      toast('Error al crear la sucursal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Nueva sucursal</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="Sucursal principal" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Dirección</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="Calle 123 # 45-67" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Teléfono</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="3001234567" />
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium">Cancelar</button>
          <button onClick={handleSave} disabled={!name || saving} className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function formatLimit(value: number, singular: string, plural: string): string {
  if (value < 0) return `Ilimitados ${plural}`;
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatBillingCycle(cycle: string): string {
  if (cycle === 'lifetime') return 'Pago único';
  return 'Mensual';
}

function formatCurrency(value: string | number): string {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numericValue) || numericValue === 0) return 'Gratis';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(numericValue);
}

function NewTerminalModal({
  branches,
  onClose,
  onSave,
}: {
  branches: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [type, setType] = useState('pos');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name || !branchId) return;
    setSaving(true);
    try {
      await tenantsApi.createTerminal({ name, branchId, type });
      toast('Terminal creada exitosamente', 'success');
      onSave();
    } catch {
      toast('Error al crear la terminal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Nueva terminal</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="Caja 2" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Sucursal *</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]">
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]">
              <option value="pos">POS</option>
              <option value="mobile_pos">Mobile POS</option>
              <option value="kiosk">Kiosko</option>
            </select>
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium">Cancelar</button>
          <button onClick={handleSave} disabled={!name || !branchId || saving} className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function NewRoleModal({ onClose, onSave }: { onClose: () => void; onSave: (role: RoleConfig) => void }) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const togglePermission = (permissionId: string) => {
    setPermissions((prev) => (prev.includes(permissionId)
      ? prev.filter((item) => item !== permissionId)
      : [...prev, permissionId]));
  };

  const handleSave = () => {
    if (!name || !id) return;
    onSave({
      id,
      name,
      description,
      permissions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-[--radius-lg] bg-[--bg-primary] shadow-[--shadow-lg]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[--border] p-5">
          <h3 className="font-semibold text-[--text-primary]">Nuevo rol</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[--radius-sm] text-[--text-tertiary] hover:bg-[--bg-tertiary]">✕</button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Nombre *</label>
              <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary] focus:border-[--nexus-500] focus:outline-none" placeholder="Supervisor" autoFocus />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">ID *</label>
              <input value={id} onChange={(event) => setId(event.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary] focus:border-[--nexus-500] focus:outline-none" placeholder="supervisor" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Descripción</label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-[92px] w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary] focus:border-[--nexus-500] focus:outline-none" placeholder="Rol para..." />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-xs font-medium text-[--text-secondary]">Permisos</label>
              <p className="text-xs text-[--text-tertiary]">{permissions.length} seleccionados</p>
            </div>
            <PermissionMatrix selected={permissions} onToggle={togglePermission} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[--border] p-5">
          <button onClick={onClose} className="rounded-[--radius-md] bg-[--bg-tertiary] px-4 py-2 text-sm font-medium text-[--text-secondary]">Cancelar</button>
          <button onClick={handleSave} disabled={!name || !id} className="rounded-[--radius-md] bg-[--nexus-500] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50">Guardar rol</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeMethods, setActiveMethods] = useState<string[]>(['Efectivo', 'Tarjeta débito', 'Nequi']);
  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [newTerminalOpen, setNewTerminalOpen] = useState(false);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [roles, setRoles] = useState<RoleConfig[]>(DEFAULT_ROLE_CONFIGS);

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['tenant-config'],
    queryFn: tenantsApi.getConfig,
    retry: false,
  });

  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: billingApi.getSubscription,
    retry: false,
  });

  const { data: branches, isLoading: loadingBranches, refetch: refetchBranches } = useQuery({
    queryKey: ['tenant-branches'],
    queryFn: tenantsApi.getBranches,
    retry: false,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['tenant-users'],
    queryFn: tenantsApi.getUsers,
    retry: false,
  });

  const { data: terminals, isLoading: loadingTerminals, refetch: refetchTerminals } = useQuery({
    queryKey: ['tenant-terminals'],
    queryFn: tenantsApi.getTerminals,
    retry: false,
  });

  useEffect(() => {
    const tenantRoles = (config as { roles?: RoleConfig[] } | undefined)?.roles;
    setRoles(Array.isArray(tenantRoles) && tenantRoles.length > 0 ? tenantRoles : DEFAULT_ROLE_CONFIGS);
  }, [config]);

  const handleSave = async () => {
    await tenantsApi.updateConfig({ roles });
    toast('Configuración guardada', 'success');
  };

  const upsertRole = (nextRole: RoleConfig) => {
    setRoles((prev) => [...prev, nextRole]);
    setNewRoleOpen(false);
  };

  const toggleMethod = (m: string) => {
    setActiveMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const currentPlan = (subscription as SubscriptionSummary | undefined)?.plan;
  const activeUsers = Array.isArray(users)
    ? (users as TenantUserRow[]).filter((user) => user.isActive !== false).length
    : 0;
  const branchCount = Array.isArray(branches) ? branches.length : 0;
  const userLimit = currentPlan?.maxUsers ?? -1;
  const branchLimit = currentPlan?.maxBranches ?? -1;

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

      <Card variant="default" padding="none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[--border]">
          <div>
            <h3 className="text-lg font-semibold text-[--text-primary]">Apariencia</h3>
            <p className="text-sm text-[--text-secondary]">Elige un tema sin cambiar la funcionalidad ni los controles.</p>
          </div>
        </div>

        <div className="p-5">
          <ThemeSelector />
        </div>
      </Card>

      <Section title="Plan y límites" icon={<Shield size={18} />} defaultOpen>
        <div className="pt-4 space-y-4">
          {loadingSubscription ? (
            <Skeleton variant="text" lines={3} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[--radius-lg] border border-[--border] bg-[--bg-secondary] p-4">
                <p className="text-xs uppercase tracking-wide text-[--text-tertiary]">Plan actual</p>
                <p className="mt-1 text-base font-semibold text-[--text-primary]">
                  {currentPlan?.name ?? 'Sin plan'}
                </p>
                <p className="mt-1 text-sm text-[--text-secondary]">
                  {currentPlan ? `${formatCurrency(currentPlan.price)} · ${formatBillingCycle(currentPlan.billingCycle)}` : 'Revisa tu suscripción desde billing.'}
                </p>
              </div>

              <div className="rounded-[--radius-lg] border border-[--border] bg-[--bg-secondary] p-4">
                <p className="text-xs uppercase tracking-wide text-[--text-tertiary]">Usuarios del sistema</p>
                <p className="mt-1 text-base font-semibold text-[--text-primary]">
                  {loadingUsers ? '...' : currentPlan ? `${activeUsers}${userLimit < 0 ? '' : ` / ${userLimit}`}` : '—'}
                </p>
                <p className="mt-1 text-sm text-[--text-secondary]">Acceso al POS, no incluye empleados de nómina.</p>
              </div>

              <div className="rounded-[--radius-lg] border border-[--border] bg-[--bg-secondary] p-4">
                <p className="text-xs uppercase tracking-wide text-[--text-tertiary]">Sucursales</p>
                <p className="mt-1 text-base font-semibold text-[--text-primary]">
                  {loadingBranches ? '...' : currentPlan ? `${branchCount}${branchLimit < 0 ? '' : ` / ${branchLimit}`}` : '—'}
                </p>
                <p className="mt-1 text-sm text-[--text-secondary]">Límite del plan para operar nuevas ubicaciones.</p>
              </div>
            </div>
          )}

          <div className="rounded-[--radius-lg] border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-100">
            Los empleados viven en el módulo de nómina. Los usuarios del sistema son quienes inician sesión y operan el POS.
          </div>

          {subscription && (
            <div className="rounded-[--radius-lg] border border-[--border] bg-[--bg-primary] p-4 text-sm text-[--text-secondary]">
              <p className="font-medium text-[--text-primary]">Estado de suscripción: {subscription.status}</p>
              <p className="mt-1">{subscription.cancelAtPeriodEnd ? 'Se cancelará al final del periodo actual.' : 'Renovación activa.'}</p>
            </div>
          )}
        </div>
      </Section>

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

      {/* Terminales */}
      <Section title="Terminales y kill-switch" icon={<MonitorSmartphone size={18} />}>
        {loadingTerminals ? (
          <div className="pt-4"><Skeleton variant="table-row" /><Skeleton variant="table-row" /></div>
        ) : (
          <div className="pt-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setNewTerminalOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
                + Nueva terminal
              </button>
            </div>
            {Array.isArray(terminals) && terminals.length > 0 ? (
              (terminals as Array<{
                id: string;
                name: string;
                branchName?: string | null;
                type: string;
                isBlocked: boolean;
                deviceFingerprint?: string | null;
              }>).map((terminal) => (
                <div key={terminal.id} className="flex flex-col gap-3 rounded-[--radius-md] bg-[--bg-secondary] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-[--text-primary] text-sm">{terminal.name}</p>
                    <p className="text-xs text-[--text-tertiary] mt-0.5">
                      {terminal.branchName ?? 'Sin sucursal'} · {terminal.type}
                    </p>
                    <p className="text-[11px] text-[--text-tertiary] mt-1 break-all">
                      Fingerprint: {terminal.deviceFingerprint ?? 'Pendiente de vincular'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', terminal.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                      {terminal.isBlocked ? 'Bloqueada' : 'Activa'}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          if (terminal.isBlocked) {
                            await tenantsApi.unblockTerminal(terminal.id);
                            toast('Terminal desbloqueada', 'success');
                          } else {
                            await tenantsApi.blockTerminal(terminal.id);
                            toast('Terminal bloqueada remotamente', 'success');
                          }
                          await refetchTerminals();
                        } catch {
                          toast('No fue posible actualizar la terminal', 'error');
                        }
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-[--radius-md] text-xs font-medium transition-colors',
                        terminal.isBlocked
                          ? 'bg-[--nexus-500] text-white hover:bg-[#1d4ed8]'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200',
                      )}
                    >
                      {terminal.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[--text-tertiary] py-4 text-center">No hay terminales configuradas</p>
            )}
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

      {/* Roles y permisos */}
      <Section title="Roles y permisos" icon={<Shield size={18} />}>
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[--text-secondary]">Define qué puede hacer cada rol dentro del tenant.</p>
            <button
              onClick={() => setNewRoleOpen(true)}
              className="inline-flex items-center gap-2 rounded-[--radius-md] bg-[--nexus-500] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              + Nuevo rol
            </button>
          </div>

          <div className="rounded-[--radius-lg] border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-100">
            Después de guardar los permisos, el usuario debe cerrar sesión e iniciar sesión de nuevo para que los cambios se reflejen en su token.
          </div>

          <div className="space-y-3">
            {roles.map((role, index) => (
              <div key={role.id} className="rounded-[--radius-md] border border-[--border] bg-[--bg-secondary] p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="Nombre">
                    <input
                      value={role.name}
                      onChange={(event) => setRoles((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, name: event.target.value } : item)))}
                      className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary] focus:border-[--nexus-500] focus:outline-none"
                    />
                  </Field>
                  <Field label="ID">
                    <input
                      value={role.id}
                      onChange={(event) => setRoles((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, id: event.target.value } : item)))}
                      className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary] focus:border-[--nexus-500] focus:outline-none"
                    />
                  </Field>
                </div>
                <Field label="Descripción">
                  <textarea
                    value={role.description}
                    onChange={(event) => setRoles((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, description: event.target.value } : item)))}
                    className="min-h-[88px] w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary] focus:border-[--nexus-500] focus:outline-none"
                  />
                </Field>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-xs font-medium text-[--text-secondary] uppercase tracking-wide">Permisos</label>
                    <p className="text-xs text-[--text-tertiary]">{role.permissions.length} seleccionados</p>
                  </div>
                  <PermissionMatrix
                    selected={role.permissions}
                    onToggle={(permissionId) => setRoles((prev) => prev.map((item, currentIndex) => {
                      if (currentIndex !== index) return item;
                      const active = item.permissions.includes(permissionId);
                      return {
                        ...item,
                        permissions: active
                          ? item.permissions.filter((value) => value !== permissionId)
                          : [...item.permissions, permissionId],
                      };
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Sucursales */}
      <Section title="Sucursales" icon={<MapPin size={18} />}>
        {loadingBranches ? (
          <div className="pt-4"><Skeleton variant="text" lines={3} /></div>
        ) : (
          <div className="pt-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setNewBranchOpen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
                + Nueva sucursal
              </button>
            </div>
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

      {newBranchOpen && <NewBranchModal onClose={() => setNewBranchOpen(false)} onSave={() => { void refetchBranches(); setNewBranchOpen(false); }} />}
      {newTerminalOpen && <NewTerminalModal branches={Array.isArray(branches) ? branches as Array<{ id: string; name: string }> : []} onClose={() => setNewTerminalOpen(false)} onSave={() => { void refetchTerminals(); setNewTerminalOpen(false); }} />}
      {newRoleOpen && <NewRoleModal onClose={() => setNewRoleOpen(false)} onSave={upsertRole} />}
    </div>
  );
}
