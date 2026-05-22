'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Phone, Mail, CreditCard } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { customersApi, api } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

interface CustomerApiRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  creditLimit?: number | string | null;
  creditBalance?: number | string | null;
  totalPurchases?: number | string | null;
  purchaseCount?: number | null;
  lastPurchaseAt?: string | null;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number | string;
  balance?: number | string | null;
  notes?: string | null;
  createdAt: string;
}

interface RecentOrder {
  id: string;
  total?: number | string | null;
  status?: string | null;
  createdAt?: string | null;
}

interface CustomerDetailApi {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  creditLimit?: number | string | null;
  creditBalance?: number | string | null;
  creditTransactions?: CreditTransaction[];
  recentOrders?: RecentOrder[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  creditLimit: number;
  creditUsed: number;
  lastOrder: string | null;
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function mapCustomerRow(raw: CustomerApiRow): Customer {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    totalOrders: Number(raw.purchaseCount ?? 0),
    totalSpent: Number(raw.totalPurchases ?? 0),
    creditLimit: Number(raw.creditLimit ?? 0),
    creditUsed: Number(raw.creditBalance ?? 0),
    lastOrder: raw.lastPurchaseAt ?? null,
  };
}

function NewCustomerModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    try {
      await api.post('/customers', { name, email, phone, creditLimit: Number(creditLimit) || 0 });
      toast('Cliente creado exitosamente', 'success');
      onSave();
    } catch {
      toast('Error al crear el cliente', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Nuevo cliente</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="Nombre del cliente" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="cliente@email.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Teléfono</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="3001234567" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Límite de crédito</label>
            <input type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="0" />
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

function PayCreditModal({ customer, onClose, onSave }: { customer: Customer; onClose: () => void; onSave: () => void }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'nequi' | 'daviplata'>('cash');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await customersApi.payCredit(customer.id, {
        amount: Number(amount),
        paymentMethod,
        reference: reference || undefined,
      });
      toast('Abono registrado exitosamente', 'success');
      onSave();
    } catch {
      toast('Error al registrar el abono', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-[--bg-primary] rounded-[--radius-lg] shadow-[--shadow-lg] w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">Registrar abono — {customer.name}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Monto del abono *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]" placeholder="0" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Método de pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="nequi">Nequi</option>
              <option value="daviplata">Daviplata</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[--text-secondary] mb-1">Referencia (opcional)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-[--border] rounded-[--radius-md] px-3 py-2 text-sm text-[--text-primary] bg-[--bg-primary] focus:outline-none focus:border-[--nexus-500]"
              placeholder="Comprobante, transferencia, recibo..."
            />
          </div>
        </div>
        <div className="p-5 border-t border-[--border] flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[--bg-tertiary] text-[--text-secondary] rounded-[--radius-md] text-sm font-medium">Cancelar</button>
          <button onClick={handleSave} disabled={!amount || Number(amount) <= 0 || saving} className="px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function CustomerDrawer({ customer, onClose, onPayCredit }: { customer: Customer; onClose: () => void; onPayCredit: (customer: Customer) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customer-detail', customer.id],
    queryFn: () => customersApi.getCustomer(customer.id),
    retry: 1,
  });

  const detail = (data ?? null) as CustomerDetailApi | null;
  const creditLimit = Number(detail?.creditLimit ?? customer.creditLimit ?? 0);
  const creditUsed = Number(detail?.creditBalance ?? customer.creditUsed ?? 0);
  const creditPct = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;
  const creditHistory = Array.isArray(detail?.creditTransactions) ? detail.creditTransactions : [];
  const recentOrders = Array.isArray(detail?.recentOrders) ? detail.recentOrders : [];

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="ml-auto w-full max-w-sm h-full bg-[--bg-primary] shadow-[--shadow-lg] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[--border]">
          <h3 className="font-semibold text-[--text-primary]">{customer.name}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-[--radius-sm] hover:bg-[--bg-tertiary] text-[--text-tertiary]" aria-label="Cerrar">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Contact */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[--text-tertiary] uppercase tracking-wide">Contacto</p>
            <div className="flex items-center gap-2 text-sm text-[--text-secondary]"><Mail size={14} />{detail?.email || customer.email || 'Sin email'}</div>
            <div className="flex items-center gap-2 text-sm text-[--text-secondary]"><Phone size={14} />{detail?.phone || customer.phone || 'Sin teléfono'}</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[--bg-secondary] rounded-[--radius-md] p-3">
              <p className="text-lg font-bold text-[--text-primary]">{customer.totalOrders}</p>
              <p className="text-xs text-[--text-secondary] mt-0.5">Órdenes</p>
            </div>
            <div className="bg-[--bg-secondary] rounded-[--radius-md] p-3">
              <p className="text-sm font-bold text-[--text-primary]">{formatCOP(customer.totalSpent)}</p>
              <p className="text-xs text-[--text-secondary] mt-0.5">Total gastado</p>
            </div>
          </div>

          {/* Credit */}
          {creditLimit > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[--text-tertiary] uppercase tracking-wide flex items-center gap-1"><CreditCard size={12} /> Crédito</p>
              <div className="flex justify-between text-xs text-[--text-secondary]">
                <span>Usado: {formatCOP(creditUsed)}</span>
                <span>Límite: {formatCOP(creditLimit)}</span>
              </div>
              <div className="h-2 bg-[--bg-tertiary] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${creditPct > 80 ? 'bg-[--danger]' : creditPct > 60 ? 'bg-[--warning]' : 'bg-[--success]'}`}
                  style={{ width: `${creditPct}%` }}
                />
              </div>
              <p className="text-xs text-right text-[--text-tertiary]">{creditPct}% utilizado</p>

              {/* Credit timeline */}
              <p className="text-xs font-medium text-[--text-tertiary] uppercase tracking-wide mt-3">Historial de crédito</p>
              {isLoading ? (
                <Skeleton variant="text" lines={4} />
              ) : creditHistory.length > 0 ? (
                <div className="space-y-2">
                  {creditHistory.map((entry) => {
                    const amount = Number(entry.amount ?? 0);
                    const isPayment = entry.type === 'payment';
                    const signedAmount = isPayment ? -Math.abs(amount) : Math.abs(amount);
                    const label = isPayment ? 'Abono' : entry.type === 'purchase' ? 'Compra fiada' : entry.type;
                    return (
                      <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-[--border] last:border-0">
                        <div>
                          <p className="text-xs font-medium text-[--text-primary]">{entry.notes || label}</p>
                          <p className="text-xs text-[--text-tertiary]">{formatDate(entry.createdAt) ?? '—'}</p>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${signedAmount > 0 ? 'text-[--danger]' : 'text-[--success]'}`}>
                          {signedAmount > 0 ? '+' : ''}{formatCOP(signedAmount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[--text-tertiary]">Sin movimientos de crédito registrados.</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-[--text-tertiary] uppercase tracking-wide">Órdenes recientes</p>
            {isLoading ? (
              <Skeleton variant="text" lines={3} />
            ) : recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-1.5 border-b border-[--border] last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[--text-primary]">Orden #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-[--text-tertiary]">{formatDate(order.createdAt) ?? '—'} · {order.status ?? '—'}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[--text-primary]">
                      {formatCOP(Number(order.total ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[--text-tertiary]">Este cliente todavía no tiene órdenes registradas.</p>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-[--border]">
          <button onClick={() => onPayCredit(customer)} className="w-full py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
            Registrar abono
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const { data: customersData, isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
    retry: 1,
  });

  const customersRaw = Array.isArray((customersData as { data?: unknown[] } | undefined)?.data)
    ? (customersData as { data: CustomerApiRow[] }).data
    : Array.isArray(customersData)
      ? customersData as CustomerApiRow[]
      : [];

  const customers: Customer[] = useMemo(
    () => customersRaw.map((row) => mapCustomerRow(row)),
    [customersRaw],
  );

  const filtered = useMemo(() =>
    customers.filter((c: Customer) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    ),
    [customers, search],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Clientes</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">{customers.length} clientes registrados</p>
        </div>
        <button onClick={() => setNewCustomerOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
          <UserPlus size={16} /> Nuevo cliente
        </button>
      </div>

      <Card variant="default" padding="md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[--border] rounded-[--radius-md] bg-[--bg-primary] text-[--text-primary] focus:outline-none focus:border-[--nexus-500]"
          />
        </div>
      </Card>

      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border] text-left text-xs text-[--text-tertiary]">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium text-right">Órdenes</th>
                <th className="px-4 py-3 font-medium text-right">Total gastado</th>
                <th className="px-4 py-3 font-medium">Crédito</th>
                <th className="px-4 py-3 font-medium">Última orden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4">
                      <Skeleton variant="table-row" />
                    </td>
                  </tr>
                ))
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-[--bg-secondary] transition-colors cursor-pointer"
                    onClick={() => setSelected(customer)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[--nexus-500] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="font-medium text-[--text-primary]">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[--text-secondary]">
                      <p>{customer.email}</p>
                      <p className="text-xs text-[--text-tertiary]">{customer.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[--text-primary]">{customer.totalOrders}</td>
                    <td className="px-4 py-3 text-right font-medium text-[--text-primary] tabular-nums">{formatCOP(customer.totalSpent)}</td>
                    <td className="px-4 py-3">
                      {customer.creditLimit > 0 ? (
                        <Badge variant={customer.creditUsed / customer.creditLimit > 0.8 ? 'danger' : customer.creditUsed > 0 ? 'warning' : 'success'}>
                          {formatCOP(customer.creditUsed)} / {formatCOP(customer.creditLimit)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[--text-tertiary]">Sin crédito</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[--text-tertiary] text-xs">{customer.lastOrder}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && (
            <div className="py-12 text-center text-[--text-tertiary] text-sm">
              {customers.length === 0 ? 'Todavía no hay clientes registrados' : 'No se encontraron clientes'}
            </div>
          )}
        </div>
      </Card>

      {newCustomerOpen && <NewCustomerModal onClose={() => setNewCustomerOpen(false)} onSave={() => { void refetch(); setNewCustomerOpen(false); }} />}
      {paymentCustomer && <PayCreditModal customer={paymentCustomer} onClose={() => setPaymentCustomer(null)} onSave={() => { void refetch(); setPaymentCustomer(null); }} />}
      {selected && <CustomerDrawer customer={selected} onClose={() => setSelected(null)} onPayCredit={(customer) => setPaymentCustomer(customer)} />}
    </div>
  );
}
