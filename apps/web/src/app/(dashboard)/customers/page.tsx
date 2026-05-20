'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Phone, Mail, CreditCard } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { customersApi } from '../../../lib/api';

const mockCustomers = [
  { id: '1', name: 'Carlos Ramírez', email: 'carlos@gmail.com', phone: '3001234567', totalOrders: 24, totalSpent: 1280000, creditLimit: 500000, creditUsed: 120000, lastOrder: '2026-05-19' },
  { id: '2', name: 'María Gómez', email: 'maria@hotmail.com', phone: '3109876543', totalOrders: 8, totalSpent: 420000, creditLimit: 0, creditUsed: 0, lastOrder: '2026-05-15' },
  { id: '3', name: 'Juan Pérez', email: 'juan@empresa.co', phone: '3205551234', totalOrders: 47, totalSpent: 3200000, creditLimit: 1000000, creditUsed: 850000, lastOrder: '2026-05-20' },
  { id: '4', name: 'Ana Martínez', email: 'ana@gmail.com', phone: '3152223344', totalOrders: 15, totalSpent: 780000, creditLimit: 300000, creditUsed: 0, lastOrder: '2026-05-10' },
  { id: '5', name: 'Luis Torres', email: 'luis@torres.co', phone: '3006667788', totalOrders: 31, totalSpent: 1950000, creditLimit: 800000, creditUsed: 600000, lastOrder: '2026-05-18' },
];

type Customer = typeof mockCustomers[0];

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function CustomerDrawer({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const creditPct = customer.creditLimit > 0 ? Math.round((customer.creditUsed / customer.creditLimit) * 100) : 0;

  const creditHistory = [
    { date: '2026-05-18', desc: 'Compra fiada', amount: +350000 },
    { date: '2026-05-15', desc: 'Abono', amount: -200000 },
    { date: '2026-05-10', desc: 'Compra fiada', amount: +170000 },
    { date: '2026-05-05', desc: 'Abono total', amount: -320000 },
  ];

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
            <div className="flex items-center gap-2 text-sm text-[--text-secondary]"><Mail size={14} />{customer.email}</div>
            <div className="flex items-center gap-2 text-sm text-[--text-secondary]"><Phone size={14} />{customer.phone}</div>
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
          {customer.creditLimit > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[--text-tertiary] uppercase tracking-wide flex items-center gap-1"><CreditCard size={12} /> Crédito</p>
              <div className="flex justify-between text-xs text-[--text-secondary]">
                <span>Usado: {formatCOP(customer.creditUsed)}</span>
                <span>Límite: {formatCOP(customer.creditLimit)}</span>
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
              <div className="space-y-2">
                {creditHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[--border] last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[--text-primary]">{entry.desc}</p>
                      <p className="text-xs text-[--text-tertiary]">{entry.date}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${entry.amount > 0 ? 'text-[--danger]' : 'text-[--success]'}`}>
                      {entry.amount > 0 ? '+' : ''}{formatCOP(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[--border]">
          <button className="w-full py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
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

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
    retry: 1,
  });

  const customers: Customer[] = Array.isArray(customersData?.data) ? customersData.data :
                                  Array.isArray(customersData) ? customersData : mockCustomers;

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
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[--nexus-500] text-white rounded-[--radius-md] text-sm font-medium hover:bg-[#1d4ed8] transition-colors">
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
            <div className="py-12 text-center text-[--text-tertiary] text-sm">No se encontraron clientes</div>
          )}
        </div>
      </Card>

      {selected && <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
