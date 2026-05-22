'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Building2, ShoppingCart, MapPin, FileText, Shield, MonitorSmartphone, Palette, Save } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { billingApi, tenantsApi } from '../../../lib/api';
import { cn } from '../../../lib/cn';
import { THEME_OPTIONS } from '../../../lib/themes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillingPlanSummary {
  id: string; name: string; slug: string;
  price: string | number; billingCycle: string;
  maxBranches: number; maxUsers: number;
}
interface SubscriptionSummary {
  id: string; status: string; cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string; plan: BillingPlanSummary | null;
}
interface TenantUserRow { id: string; isActive?: boolean; }
type RoleConfig = { id: string; name: string; description: string; permissions: string[]; };
type PermissionOption = { id: string; label: string; description: string; route?: string; importance?: 'high' | 'medium' | 'low'; };
type PermissionGroup = { id: string; title: string; description: string; options: PermissionOption[]; };

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta débito', 'Tarjeta crédito', 'Nequi', 'Daviplata', 'Transferencia'];

const PERMISSION_GROUPS: PermissionGroup[] = [
  { id: 'dashboard', title: 'Dashboard', description: 'Acceso a métricas, tarjetas y resumen operativo.', options: [{ id: 'dashboard:read', label: 'Ver dashboard', description: 'Abre el resumen general del negocio.', route: '/dashboard', importance: 'high' }] },
  { id: 'inventory', title: 'Inventario', description: 'Productos, variantes, stock y valuación.', options: [{ id: 'inventory:read', label: 'Ver inventario', description: 'Consultar productos, existencias y kardex.', route: '/inventory' }, { id: 'inventory:write', label: 'Editar inventario', description: 'Crear productos, ajustar stock y gestionar variantes.', route: '/inventory', importance: 'high' }] },
  { id: 'orders', title: 'Órdenes y POS', description: 'Ventas, cobros y seguimiento de órdenes.', options: [{ id: 'orders:read', label: 'Ver órdenes', description: 'Abrir historial y detalle de ventas.', route: '/orders' }, { id: 'orders:write', label: 'Crear ventas', description: 'Cobrar, crear y suspender órdenes desde POS.', route: '/pos', importance: 'high' }] },
  { id: 'customers', title: 'Clientes', description: 'Base de clientes, crédito y comportamiento.', options: [{ id: 'customers:read', label: 'Ver clientes', description: 'Consultar clientes, deuda y compras.' }] },
  { id: 'users', title: 'Usuarios y equipo', description: 'Personal, roles y acceso interno.', options: [{ id: 'users:read', label: 'Ver usuarios', description: 'Listar equipo y revisar roles actuales.' }, { id: 'users:write', label: 'Editar usuarios', description: 'Crear usuarios y ajustar sus accesos.', importance: 'high' }] },
  { id: 'settings', title: 'Configuración', description: 'Ajustes del tenant, sucursales y terminales.', options: [{ id: 'settings:write', label: 'Editar configuración', description: 'Cambiar ajustes globales del tenant.', importance: 'high' }] },
];

const DEFAULT_ROLE_CONFIGS: RoleConfig[] = [
  { id: 'owner', name: 'Owner', description: 'Control total del negocio y configuración.', permissions: ['dashboard:read', 'inventory:write', 'orders:write', 'settings:write', 'users:write'] },
  { id: 'manager', name: 'Manager', description: 'Administra operaciones y equipo.', permissions: ['dashboard:read', 'inventory:write', 'orders:read', 'users:read'] },
  { id: 'cashier', name: 'Cashier', description: 'Opera la caja y las ventas del POS.', permissions: ['dashboard:read', 'orders:write', 'customers:read'] },
];

const NAV_ITEMS = [
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'plan', label: 'Plan y límites', icon: Shield },
  { id: 'business', label: 'Negocio', icon: Building2 },
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'branches', label: 'Sucursales', icon: MapPin },
  { id: 'terminals', label: 'Terminales', icon: MonitorSmartphone },
  { id: 'roles', label: 'Roles y permisos', icon: Shield },
  { id: 'dian', label: 'Facturación DIAN', icon: FileText },
  { id: 'danger', label: 'Zona de peligro', icon: AlertTriangle },
] as const;

type TabId = typeof NAV_ITEMS[number]['id'];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
      style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
    />
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{children}</h2>
      {action}
    </div>
  );
}

function InfoBox({ children, variant = 'warning' }: { children: React.ReactNode; variant?: 'warning' | 'info' }) {
  const colors = variant === 'warning'
    ? { bg: 'rgba(234,179,8,0.06)', border: 'rgba(234,179,8,0.2)', color: 'var(--warning-text)' }
    : { bg: 'var(--info-bg)', border: 'rgba(99,179,237,0.2)', color: 'var(--info-text)' };
  return (
    <div className="px-4 py-3 rounded-lg text-sm leading-relaxed" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color }}>
      {children}
    </div>
  );
}

// ─── Theme selector ───────────────────────────────────────────────────────────

function ThemeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{THEME_OPTIONS.map((t) => <div key={t.id} className="h-28 rounded-xl" style={{ background: 'var(--bg-subtle)' }} />)}</div>;
  }
  const current = resolvedTheme ?? theme ?? 'light';

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {THEME_OPTIONS.map((option) => {
        const active = current === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className="rounded-xl p-4 text-left transition-all hover:-translate-y-0.5"
            style={{
              border: active ? '1.5px solid var(--gold-500)' : '1px solid var(--border-default)',
              background: active ? 'rgba(201,168,76,0.06)' : 'var(--bg-surface)',
              boxShadow: active ? '0 0 0 3px rgba(201,168,76,0.1)' : 'none',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{option.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{option.description}</p>
              </div>
              {active && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ background: 'var(--gold-500)', color: '#0A0A0A' }}>
                  Activo
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-8 rounded-lg border border-black/5" style={{ background: option.surface }} />
              <div className="h-8 rounded-lg border border-black/5" style={{ background: option.muted }} />
              <div className="h-8 rounded-lg border border-black/5" style={{ background: option.accent }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Permission matrix ────────────────────────────────────────────────────────

function PermissionMatrix({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map((group) => {
        const count = group.options.filter((o) => selected.includes(o.id)).length;
        const all = count === group.options.length && group.options.length > 0;
        const some = count > 0 && !all;
        return (
          <div key={group.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{group.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{group.description}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase whitespace-nowrap"
                style={{ background: all ? 'var(--gold-500)' : some ? 'rgba(201,168,76,0.12)' : 'var(--bg-subtle)', color: all ? '#0A0A0A' : some ? 'var(--gold-500)' : 'var(--text-tertiary)' }}>
                {count}/{group.options.length}
              </span>
            </div>
            <div className="space-y-2">
              {group.options.map((option) => {
                const active = selected.includes(option.id);
                return (
                  <button key={option.id} type="button" onClick={() => onToggle(option.id)}
                    className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors"
                    style={{ border: `1px solid ${active ? 'var(--gold-500)' : 'var(--border-default)'}`, background: active ? 'rgba(201,168,76,0.06)' : 'var(--bg-base)' }}>
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold"
                      style={{ border: `1px solid ${active ? 'var(--gold-500)' : 'var(--border-default)'}`, background: active ? 'var(--gold-500)' : 'transparent', color: active ? '#0A0A0A' : 'transparent' }}>
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{option.label}</p>
                        {option.importance === 'high' && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold-500)' }}>Importante</span>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{option.description}</p>
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

// ─── Modals ───────────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors" style={{ color: 'var(--text-tertiary)', background: 'var(--bg-subtle)' }}>✕</button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border-default)' }}>{footer}</div>
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, placeholder, type = 'text', autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
        style={{ border: '1px solid var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold-500)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
      />
    </div>
  );
}

function BtnPrimary({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button onClick={onClick} disabled={disabled} className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40" style={{ background: 'var(--gold-500)', color: '#0A0A0A' }}>{children}</button>;
}
function BtnSecondary({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>{children}</button>;
}

function NewBranchModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    try { await tenantsApi.createBranch({ name, address, phone }); toast('Sucursal creada', 'success'); onSave(); }
    catch { toast('Error al crear la sucursal', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title="Nueva sucursal" onClose={onClose} footer={<><BtnSecondary onClick={onClose}>Cancelar</BtnSecondary><BtnPrimary onClick={handleSave} disabled={!name || saving}>{saving ? 'Guardando...' : 'Guardar'}</BtnPrimary></>}>
      <ModalInput label="Nombre *" value={name} onChange={setName} placeholder="Sucursal principal" autoFocus />
      <ModalInput label="Dirección" value={address} onChange={setAddress} placeholder="Calle 123 # 45-67" />
      <ModalInput label="Teléfono" value={phone} onChange={setPhone} placeholder="3001234567" />
    </ModalShell>
  );
}

function NewTerminalModal({ branches, onClose, onSave }: { branches: Array<{ id: string; name: string }>; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [type, setType] = useState('pos');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name || !branchId) return;
    setSaving(true);
    try { await tenantsApi.createTerminal({ name, branchId, type }); toast('Terminal creada', 'success'); onSave(); }
    catch { toast('Error al crear la terminal', 'error'); }
    finally { setSaving(false); }
  };

  const selectStyle = { border: '1px solid var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)' };

  return (
    <ModalShell title="Nueva terminal" onClose={onClose} footer={<><BtnSecondary onClick={onClose}>Cancelar</BtnSecondary><BtnPrimary onClick={handleSave} disabled={!name || !branchId || saving}>{saving ? 'Guardando...' : 'Guardar'}</BtnPrimary></>}>
      <ModalInput label="Nombre *" value={name} onChange={setName} placeholder="Caja 2" autoFocus />
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Sucursal *</label>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={selectStyle}>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={selectStyle}>
          <option value="pos">POS</option>
          <option value="mobile_pos">Mobile POS</option>
          <option value="kiosk">Kiosko</option>
        </select>
      </div>
    </ModalShell>
  );
}

function NewRoleModal({ onClose, onSave }: { onClose: () => void; onSave: (role: RoleConfig) => void }) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const toggle = (pid: string) => setPermissions((prev) => prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Nuevo rol</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm" style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>✕</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <ModalInput label="Nombre *" value={name} onChange={setName} placeholder="Supervisor" autoFocus />
            <ModalInput label="ID *" value={id} onChange={setId} placeholder="supervisor" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rol para..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none min-h-[80px] resize-none"
              style={{ border: '1px solid var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Permisos</label>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{permissions.length} seleccionados</span>
            </div>
            <PermissionMatrix selected={permissions} onToggle={toggle} />
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-2 flex-shrink-0" style={{ borderTop: '1px solid var(--border-default)' }}>
          <BtnSecondary onClick={onClose}>Cancelar</BtnSecondary>
          <BtnPrimary onClick={() => { if (name && id) { onSave({ id, name, description, permissions }); } }} disabled={!name || !id}>Guardar rol</BtnPrimary>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n) || n === 0) return 'Gratis';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}
function formatBillingCycle(cycle: string): string {
  return cycle === 'lifetime' ? 'Pago único' : 'Mensual';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('appearance');
  const [activeMethods, setActiveMethods] = useState<string[]>(['Efectivo', 'Tarjeta débito', 'Nequi']);
  const [newBranchOpen, setNewBranchOpen] = useState(false);
  const [newTerminalOpen, setNewTerminalOpen] = useState(false);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [roles, setRoles] = useState<RoleConfig[]>(DEFAULT_ROLE_CONFIGS);

  const { data: config, isLoading: loadingConfig } = useQuery({ queryKey: ['tenant-config'], queryFn: tenantsApi.getConfig, retry: false });
  const { data: subscription, isLoading: loadingSubscription } = useQuery({ queryKey: ['billing-subscription'], queryFn: billingApi.getSubscription, retry: false });
  const { data: branches, isLoading: loadingBranches, refetch: refetchBranches } = useQuery({ queryKey: ['tenant-branches'], queryFn: tenantsApi.getBranches, retry: false });
  const { data: users, isLoading: loadingUsers } = useQuery({ queryKey: ['tenant-users'], queryFn: tenantsApi.getUsers, retry: false });
  const { data: terminals, isLoading: loadingTerminals, refetch: refetchTerminals } = useQuery({ queryKey: ['tenant-terminals'], queryFn: tenantsApi.getTerminals, retry: false });

  useEffect(() => {
    const tenantRoles = (config as { roles?: RoleConfig[] } | undefined)?.roles;
    setRoles(Array.isArray(tenantRoles) && tenantRoles.length > 0 ? tenantRoles : DEFAULT_ROLE_CONFIGS);
  }, [config]);

  const handleSave = async () => {
    await tenantsApi.updateConfig({ roles });
    toast('Configuración guardada', 'success');
  };

  const currentPlan = (subscription as SubscriptionSummary | undefined)?.plan;
  const activeUsers = Array.isArray(users) ? (users as TenantUserRow[]).filter((u) => u.isActive !== false).length : 0;
  const branchCount = Array.isArray(branches) ? branches.length : 0;
  const userLimit = currentPlan?.maxUsers ?? -1;
  const branchLimit = currentPlan?.maxBranches ?? -1;

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors";
  const inputSty = { border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' };

  return (
    <div className="flex h-full min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col py-6 px-3 gap-1"
        style={{ borderRight: '1px solid var(--border-default)', background: 'var(--bg-surface)', minHeight: '100vh' }}
      >
        <div className="px-3 mb-4">
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Configuración</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Ajusta tu negocio y equipo</p>
        </div>

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          const isDanger = id === 'danger';
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left w-full transition-all', active && !isDanger && 'font-semibold')}
              style={{
                background: active ? (isDanger ? 'rgba(240,68,56,0.08)' : 'rgba(201,168,76,0.1)') : 'transparent',
                color: active
                  ? (isDanger ? 'var(--danger-text)' : 'var(--gold-500)')
                  : (isDanger ? 'var(--danger-text)' : 'var(--text-secondary)'),
              }}
            >
              <Icon size={15} className="flex-shrink-0" />
              {label}
            </button>
          );
        })}

        <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--gold-500)', color: '#0A0A0A' }}
          >
            <Save size={14} /> Guardar cambios
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Apariencia */}
        {tab === 'appearance' && (
          <div>
            <SectionTitle>Apariencia</SectionTitle>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Elige un tema para toda la plataforma. El cambio se aplica inmediatamente.</p>
            <ThemeSelector />
          </div>
        )}

        {/* Plan y límites */}
        {tab === 'plan' && (
          <div>
            <SectionTitle>Plan y límites</SectionTitle>
            {loadingSubscription ? <Skeleton variant="text" lines={4} /> : (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Plan actual', value: currentPlan?.name ?? 'Sin plan', sub: currentPlan ? `${formatCurrency(currentPlan.price)} · ${formatBillingCycle(currentPlan.billingCycle)}` : 'Revisa tu suscripción.' },
                    { label: 'Usuarios del sistema', value: loadingUsers ? '...' : currentPlan ? `${activeUsers}${userLimit < 0 ? '' : ` / ${userLimit}`}` : '—', sub: 'Quienes inician sesión y operan el POS.' },
                    { label: 'Sucursales', value: loadingBranches ? '...' : currentPlan ? `${branchCount}${branchLimit < 0 ? '' : ` / ${branchLimit}`}` : '—', sub: 'Ubicaciones físicas configuradas.' },
                  ].map((card) => (
                    <div key={card.label} className="rounded-xl p-5" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-tertiary)' }}>{card.label}</p>
                      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{card.value}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{card.sub}</p>
                    </div>
                  ))}
                </div>
                <InfoBox>Los empleados viven en el módulo de nómina. Los usuarios del sistema son quienes inician sesión y operan el POS.</InfoBox>
                {subscription && (
                  <div className="rounded-xl p-4 text-sm" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                    <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Estado: {(subscription as SubscriptionSummary).status}</p>
                    <p>{(subscription as SubscriptionSummary).cancelAtPeriodEnd ? 'Se cancelará al final del periodo actual.' : 'Renovación automática activa.'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Negocio */}
        {tab === 'business' && (
          <div>
            <SectionTitle>Información del negocio</SectionTitle>
            {loadingConfig ? <Skeleton variant="text" lines={5} /> : (
              <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
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
          </div>
        )}

        {/* POS */}
        {tab === 'pos' && (
          <div>
            <SectionTitle>Configuración del POS</SectionTitle>
            <div className="space-y-6 max-w-2xl">
              <Field label="Plantilla de negocio">
                <select className={inputCls} style={inputSty}>
                  <option>Tienda de ropa</option>
                  <option>Restaurante</option>
                  <option>Minimercado</option>
                  <option>Papelería</option>
                  <option>Otro</option>
                </select>
              </Field>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>Métodos de pago activos</label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const active = activeMethods.includes(m);
                    return (
                      <button key={m} onClick={() => setActiveMethods((prev) => active ? prev.filter((x) => x !== m) : [...prev, m])}
                        className="px-3 py-1.5 text-sm rounded-full border transition-all"
                        style={{ background: active ? 'var(--gold-500)' : 'var(--bg-surface)', color: active ? '#0A0A0A' : 'var(--text-secondary)', borderColor: active ? 'var(--gold-500)' : 'var(--border-default)' }}>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="Impuestos">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded" style={{ accentColor: 'var(--gold-500)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>IVA 19% habilitado</span>
                </label>
              </Field>
            </div>
          </div>
        )}

        {/* Sucursales */}
        {tab === 'branches' && (
          <div>
            <SectionTitle action={<BtnPrimary onClick={() => setNewBranchOpen(true)}>+ Nueva sucursal</BtnPrimary>}>
              Sucursales
            </SectionTitle>
            {loadingBranches ? <Skeleton variant="text" lines={3} /> : (
              <div className="space-y-3">
                {Array.isArray(branches) && branches.length > 0 ? (
                  (branches as Array<{ id: string; name: string; address?: string; isMain?: boolean }>).map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{b.address ?? 'Sin dirección registrada'}</p>
                      </div>
                      {b.isMain && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--gold-500)', border: '1px solid var(--border-gold)' }}>Principal</span>}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                    <MapPin size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hay sucursales configuradas</p>
                    <p className="text-xs mt-1">Crea tu primera sucursal para comenzar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Terminales */}
        {tab === 'terminals' && (
          <div>
            <SectionTitle action={<BtnPrimary onClick={() => setNewTerminalOpen(true)}>+ Nueva terminal</BtnPrimary>}>
              Terminales y kill-switch
            </SectionTitle>
            {loadingTerminals ? <><Skeleton variant="table-row" /><Skeleton variant="table-row" /></> : (
              <div className="space-y-3">
                {Array.isArray(terminals) && terminals.length > 0 ? (
                  (terminals as Array<{ id: string; name: string; branchName?: string | null; type: string; isBlocked: boolean; deviceFingerprint?: string | null }>).map((terminal) => (
                    <div key={terminal.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{terminal.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{terminal.branchName ?? 'Sin sucursal'} · {terminal.type}</p>
                        <p className="text-xs mt-1 break-all" style={{ color: 'var(--text-tertiary)' }}>Fingerprint: {terminal.deviceFingerprint ?? 'Pendiente de vincular'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ background: terminal.isBlocked ? 'var(--danger-bg)' : 'var(--success-bg)', color: terminal.isBlocked ? 'var(--danger-text)' : 'var(--success-text)' }}>
                          {terminal.isBlocked ? 'Bloqueada' : 'Activa'}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              if (terminal.isBlocked) { await tenantsApi.unblockTerminal(terminal.id); toast('Terminal desbloqueada', 'success'); }
                              else { await tenantsApi.blockTerminal(terminal.id); toast('Terminal bloqueada remotamente', 'success'); }
                              await refetchTerminals();
                            } catch { toast('No fue posible actualizar la terminal', 'error'); }
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={terminal.isBlocked
                            ? { background: 'var(--gold-500)', color: '#0A0A0A' }
                            : { background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-text)' }}>
                          {terminal.isBlocked ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                    <MonitorSmartphone size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hay terminales configuradas</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Roles y permisos */}
        {tab === 'roles' && (
          <div>
            <SectionTitle action={<BtnPrimary onClick={() => setNewRoleOpen(true)}>+ Nuevo rol</BtnPrimary>}>
              Roles y permisos
            </SectionTitle>
            <InfoBox>Después de guardar los cambios, el usuario debe cerrar e iniciar sesión para que los nuevos permisos se apliquen a su token.</InfoBox>
            <div className="mt-6 space-y-6">
              {roles.map((role, index) => (
                <div key={role.id} className="rounded-xl p-5" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <Field label="Nombre">
                      <input value={role.name} onChange={(e) => setRoles((prev) => prev.map((r, i) => i === index ? { ...r, name: e.target.value } : r))} className={inputCls} style={inputSty} />
                    </Field>
                    <Field label="ID">
                      <input value={role.id} onChange={(e) => setRoles((prev) => prev.map((r, i) => i === index ? { ...r, id: e.target.value } : r))} className={inputCls} style={inputSty} />
                    </Field>
                  </div>
                  <Field label="Descripción">
                    <textarea value={role.description} onChange={(e) => setRoles((prev) => prev.map((r, i) => i === index ? { ...r, description: e.target.value } : r))}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none min-h-[72px]" style={inputSty} />
                  </Field>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Permisos</label>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{role.permissions.length} seleccionados</span>
                    </div>
                    <PermissionMatrix
                      selected={role.permissions}
                      onToggle={(pid) => setRoles((prev) => prev.map((r, i) => {
                        if (i !== index) return r;
                        const has = r.permissions.includes(pid);
                        return { ...r, permissions: has ? r.permissions.filter((p) => p !== pid) : [...r.permissions, pid] };
                      }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIAN */}
        {tab === 'dian' && (
          <div>
            <SectionTitle>Facturación electrónica — DIAN</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
              <Field label="Prefijo de factura"><TextInput placeholder="SETP" /></Field>
              <Field label="Número de resolución"><TextInput placeholder="18764000001" /></Field>
              <Field label="Rango desde"><TextInput placeholder="1" /></Field>
              <Field label="Rango hasta"><TextInput placeholder="5000000" /></Field>
              <div className="sm:col-span-2">
                <Field label="Certificado digital (.p12)">
                  <div className="border-2 border-dashed rounded-xl px-6 py-10 text-center" style={{ borderColor: 'var(--border-default)' }}>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>Arrastra tu certificado aquí o haz clic para subir</p>
                    <button className="text-xs font-medium" style={{ color: 'var(--gold-500)' }}>Seleccionar archivo</button>
                  </div>
                </Field>
              </div>
            </div>
          </div>
        )}

        {/* Zona de peligro */}
        {tab === 'danger' && (
          <div>
            <SectionTitle>Zona de peligro</SectionTitle>
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Cambiar contraseña</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Actualiza tu contraseña de acceso al sistema</p>
                </div>
                <button className="px-3 py-1.5 text-sm rounded-lg transition-colors" style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-subtle)' }}>
                  Cambiar
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ border: '1px solid var(--danger-text)', background: 'var(--danger-bg)' }}>
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--danger-text)' }}>
                    <AlertTriangle size={14} /> Cerrar sesión en todos los dispositivos
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Invalida todos los tokens activos de tu cuenta de inmediato</p>
                </div>
                <button className="px-3 py-1.5 text-sm rounded-lg font-medium text-white transition-colors" style={{ background: 'var(--danger-text)' }}>
                  Cerrar todas
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {newBranchOpen && <NewBranchModal onClose={() => setNewBranchOpen(false)} onSave={() => { void refetchBranches(); setNewBranchOpen(false); }} />}
      {newTerminalOpen && <NewTerminalModal branches={Array.isArray(branches) ? branches as Array<{ id: string; name: string }> : []} onClose={() => setNewTerminalOpen(false)} onSave={() => { void refetchTerminals(); setNewTerminalOpen(false); }} />}
      {newRoleOpen && <NewRoleModal onClose={() => setNewRoleOpen(false)} onSave={(role) => { setRoles((prev) => [...prev, role]); setNewRoleOpen(false); }} />}
    </div>
  );
}
