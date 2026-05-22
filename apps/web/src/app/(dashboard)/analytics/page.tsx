'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, Legend, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Banknote, CreditCard, Package, ReceiptText, Store, TrendingUp, Users } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { analyticsApi, tenantsApi } from '../../../lib/api';

type Range = '7d' | '30d' | '3m';

const RANGE_OPTIONS: Array<{ label: string; value: Range; days: number }> = [
  { label: '7 días', value: '7d', days: 7 },
  { label: '30 días', value: '30d', days: 30 },
  { label: '3 meses', value: '3m', days: 90 },
];

const COLORS = ['#C9A84C', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function selectRangeDays(range: Range) {
  return RANGE_OPTIONS.find((option) => option.value === range)?.days ?? 30;
}

type AnalyticsTab = 'sales' | 'expenses' | 'employees';

const ANALYTICS_TABS: Array<{ id: AnalyticsTab; label: string; description: string; icon: React.ReactNode }> = [
  { id: 'sales', label: 'Ventas', description: 'Resumen operativo, mix de pago y órdenes recientes.', icon: <Store size={16} /> },
  { id: 'expenses', label: 'Gastos', description: 'Control de deuda, categorías y salidas de caja.', icon: <ReceiptText size={16} /> },
  { id: 'employees', label: 'Empleados', description: 'Desempeño por cajero y rendimiento comercial.', icon: <Users size={16} /> },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d');
  const [branchId, setBranchId] = useState('all');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('sales');

  const { data: branchesData } = useQuery({
    queryKey: ['tenant-branches-analytics'],
    queryFn: tenantsApi.getBranches,
    retry: false,
  });

  const dateWindow = useMemo(() => {
    const days = selectRangeDays(range);
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return { from, to };
  }, [range]);

  const analyticsParams = useMemo(() => ({
    dateFrom: dateWindow.from.toISOString(),
    dateTo: dateWindow.to.toISOString(),
    ...(branchId !== 'all' ? { branchId } : {}),
  }), [branchId, dateWindow.from, dateWindow.to]);

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['analytics-sales', range, branchId],
    queryFn: () => analyticsApi.getSalesSummary(analyticsParams),
    retry: 1,
  });

  const { data: performanceData, isLoading: loadingPerformance } = useQuery({
    queryKey: ['analytics-performance'],
    queryFn: analyticsApi.getProductPerformance,
    retry: 1,
  });

  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ['analytics-inventory-valuation'],
    queryFn: analyticsApi.getInventoryValuation,
    retry: 1,
  });

  const { data: customerData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['analytics-customer-insights'],
    queryFn: analyticsApi.getCustomerInsights,
    retry: 1,
  });

  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['analytics-expenses', range, branchId],
    queryFn: () => analyticsApi.getExpensesSummary(analyticsParams),
    retry: 1,
    enabled: activeTab === 'expenses',
  });

  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ['analytics-employees', range, branchId],
    queryFn: () => analyticsApi.getEmployeePerformance(analyticsParams),
    retry: 1,
    enabled: activeTab === 'employees',
  });

  const branches = Array.isArray(branchesData) ? branchesData : [];
  const sales = (salesData ?? {}) as {
    totalSales?: number;
    totalOrders?: number;
    avgTicket?: number;
    salesByDay?: Array<{ day: string; ventas: number; ordenes: number }>;
    revenueByPaymentMethod?: Array<{ method: string; amount: number; percentage: number }>;
    recentOrders?: Array<{ id: string; customer: string; total: number; status: string; time: string }>;
  };
  const performance = (performanceData ?? {}) as {
    topByRevenue?: Array<{ name: string; revenue: number; quantity: number; currentStock: number; daysSinceLastSale: number }>;
    bottomByRotation?: Array<{ name: string; revenue: number; quantity: number; currentStock: number; daysSinceLastSale: number }>;
  };
  const inventory = (inventoryData ?? {}) as {
    totalCost?: number;
    totalRetailValue?: number;
    estimatedMargin?: number;
    byCategory?: Array<{ category: string; cost: number; retailValue: number; margin: number }>;
  };
  const customers = (customerData ?? {}) as {
    totalCustomers?: number;
    customersWithDebt?: number;
    totalDebtAmount?: number;
    avgPurchaseFrequency?: number;
    topCustomers?: Array<{ customerId: string; name: string; totalPurchases: number; purchaseCount: number; creditBalance: number }>;
  };
  const expenses = (expensesData ?? {}) as {
    total?: number;
    paid?: number;
    pending?: number;
    byCategory?: Array<{ category: string; total: number; count: number; paid: number; pending: number }>;
  };
  const employees = Array.isArray(employeesData)
    ? (employeesData as Array<{ cashierId: string; totalSales: number; totalOrders: number; avgTicket: number }>)
    : [];

  const chartRevenue = sales.salesByDay ?? [];
  const paymentMix = sales.revenueByPaymentMethod ?? [];
  const inventoryByCategory = inventory.byCategory ?? [];
  const topByRevenue = performance.topByRevenue ?? [];
  const slowMovers = performance.bottomByRotation ?? [];
  const topCustomers = customers.topCustomers ?? [];
  const recentOrders = sales.recentOrders ?? [];
  const expensesByCategory = expenses.byCategory ?? [];
  const activeTabInfo = ANALYTICS_TABS.find((tab) => tab.id === activeTab) ?? ANALYTICS_TABS[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Analíticas</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Tendencias, mix de pago, inventario y clientes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="all">Todas las sucursales</option>
            {branches.map((branch: { id: string; name: string }) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm transition-colors ${range === option.value ? 'bg-[var(--bg-surface)] font-medium text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card variant="default" padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Sección activa</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{activeTabInfo.label}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{activeTabInfo.description}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[rgba(201,168,76,0.12)] text-[var(--text-gold)]">
              {activeTabInfo.icon}
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Cambio rápido</p>
          <div className="mt-3 flex flex-col gap-2">
            {ANALYTICS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2 text-left transition-colors ${activeTab === tab.id ? 'border-[var(--border-gold)] bg-[var(--bg-subtle)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-gold)]'}`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  {tab.icon}
                  {tab.label}
                </span>
                {activeTab === tab.id && <span className="text-xs text-[var(--text-gold)]">Activo</span>}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-1 w-fit">
        {ANALYTICS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Ventas */}
      {activeTab === 'sales' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard icon={<TrendingUp size={18} />} label="Ventas" value={formatCOP(sales.totalSales ?? 0)} loading={loadingSales} />
            <MetricCard icon={<ReceiptText size={18} />} label="Órdenes" value={(sales.totalOrders ?? 0).toLocaleString('es-CO')} loading={loadingSales} />
            <MetricCard icon={<Banknote size={18} />} label="Ticket promedio" value={formatCOP(sales.avgTicket ?? 0)} loading={loadingSales} />
            <MetricCard icon={<Package size={18} />} label="Valor inventario" value={formatCOP(inventory.totalRetailValue ?? 0)} loading={loadingInventory} />
            <MetricCard icon={<Users size={18} />} label="Clientes" value={(customers.totalCustomers ?? 0).toLocaleString('es-CO')} loading={loadingCustomers} />
            <MetricCard icon={<CreditCard size={18} />} label="Deuda" value={formatCOP(customers.totalDebtAmount ?? 0)} loading={loadingCustomers} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card variant="default" padding="lg" className="xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Ventas por día</h2>
                <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)]">{range}</span>
              </div>
              {loadingSales ? (
                <Skeleton variant="rect" height={260} className="w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="nexus-revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip formatValue={formatCOP} />} />
                    <Area type="monotone" dataKey="ventas" stroke="#C9A84C" strokeWidth={2.5} fill="url(#nexus-revenue)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card variant="default" padding="lg">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Mix de pago</h2>
              {loadingSales ? (
                <Skeleton variant="rect" height={260} className="w-full" />
              ) : paymentMix.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={paymentMix} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<ChartTooltip formatValue={formatCOP} />} />
                    <Bar dataKey="amount" fill="#2563EB" radius={[0, 8, 8, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Sin datos de pagos</div>
              )}
              <div className="mt-3 space-y-2">
                {paymentMix.map((item) => (
                  <div key={item.method} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{item.method}</span>
                    <span className="font-medium text-[var(--text-primary)]">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card variant="default" padding="lg">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Inventario por categoría</h2>
                <span className="text-xs text-[var(--text-secondary)]">Margen estimado {inventory.estimatedMargin ?? 0}%</span>
              </div>
              {loadingInventory ? (
                <Skeleton variant="rect" height={260} className="w-full" />
              ) : inventoryByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inventoryByCategory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip formatValue={formatCOP} />} />
                    <Legend />
                    <Bar dataKey="cost" name="Costo" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="retailValue" name="Retail" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Sin valuación de inventario</div>
              )}
            </Card>

            <Card variant="default" padding="lg">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Top clientes</h2>
              {loadingCustomers ? (
                <Skeleton variant="text" lines={6} />
              ) : topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {topCustomers.map((customer) => (
                    <div key={customer.customerId} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-3">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{customer.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{customer.purchaseCount} compras · deuda {formatCOP(customer.creditBalance)}</p>
                      </div>
                      <p className="font-medium text-[var(--text-gold)]">{formatCOP(customer.totalPurchases)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Sin datos de clientes</div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatBox label="Con deuda" value={(customers.customersWithDebt ?? 0).toString()} />
                <StatBox label="Frecuencia" value={(customers.avgPurchaseFrequency ?? 0).toString()} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card variant="default" padding="lg">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Top productos</h2>
              {loadingPerformance ? (
                <Skeleton variant="text" lines={6} />
              ) : topByRevenue.length > 0 ? (
                <div className="space-y-3">
                  {topByRevenue.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-3">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{item.quantity} uds · {item.currentStock} en stock</p>
                      </div>
                      <p className="font-medium text-[var(--text-gold)]">{formatCOP(item.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Sin ventas por producto</div>
              )}
            </Card>

            <Card variant="default" padding="lg">
              <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Productos de baja rotación</h2>
              {loadingPerformance ? (
                <Skeleton variant="text" lines={6} />
              ) : slowMovers.length > 0 ? (
                <div className="space-y-3">
                  {slowMovers.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-3">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Última venta hace {item.daysSinceLastSale} días</p>
                      </div>
                      <p className="text-sm font-medium text-[var(--text-secondary)]">{item.currentStock} uds</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Sin datos de rotación</div>
              )}
            </Card>
          </div>

          <Card variant="default" padding="lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Órdenes recientes</h2>
              <span className="text-xs text-[var(--text-secondary)]">{recentOrders.length} últimas</span>
            </div>
            {loadingSales ? (
              <Skeleton variant="text" lines={6} />
            ) : recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-tertiary)]">
                      <th className="px-4 py-3 font-medium">Orden</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{order.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{order.customer}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{order.status}</td>
                        <td className="px-4 py-3 text-[var(--text-primary)]">{formatCOP(order.total)}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">No hay órdenes para mostrar</div>
            )}
          </Card>
        </>
      )}

      {/* Tab: Gastos */}
      {activeTab === 'expenses' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard icon={<Banknote size={18} />} label="Total gastos" value={formatCOP(expenses.total ?? 0)} loading={loadingExpenses} />
            <MetricCard icon={<TrendingUp size={18} />} label="Pagados" value={formatCOP(expenses.paid ?? 0)} loading={loadingExpenses} />
            <MetricCard icon={<ReceiptText size={18} />} label="En deuda" value={formatCOP(expenses.pending ?? 0)} loading={loadingExpenses} />
          </div>

          <Card variant="default" padding="lg">
            <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Gastos por categoría</h2>
            {loadingExpenses ? (
              <Skeleton variant="text" lines={6} />
            ) : expensesByCategory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-tertiary)]">
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                      <th className="px-4 py-3 font-medium text-right">Pagados</th>
                      <th className="px-4 py-3 font-medium text-right">En deuda</th>
                      <th className="px-4 py-3 font-medium text-right"># Transacciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {expensesByCategory.map((row) => (
                      <tr key={row.category} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.category}</td>
                        <td className="px-4 py-3 text-right text-[var(--text-primary)] tabular-nums">{formatCOP(row.total)}</td>
                        <td className="px-4 py-3 text-right text-[var(--success-text,#16a34a)] tabular-nums">{formatCOP(row.paid)}</td>
                        <td className="px-4 py-3 text-right text-[var(--danger-text,#dc2626)] tabular-nums">{formatCOP(row.pending)}</td>
                        <td className="px-4 py-3 text-right text-[var(--text-secondary)] tabular-nums">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Sin gastos en el periodo seleccionado</div>
            )}
          </Card>
        </>
      )}

      {/* Tab: Empleados */}
      {activeTab === 'employees' && (
        <Card variant="default" padding="lg">
          <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Rendimiento por empleado</h2>
          {loadingEmployees ? (
            <Skeleton variant="text" lines={6} />
          ) : employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-left text-xs text-[var(--text-tertiary)]">
                    <th className="px-4 py-3 font-medium">Empleado</th>
                    <th className="px-4 py-3 font-medium text-right">Ventas totales</th>
                    <th className="px-4 py-3 font-medium text-right"># Órdenes</th>
                    <th className="px-4 py-3 font-medium text-right">Ticket promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {employees.map((emp, idx) => (
                    <tr key={emp.cashierId} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0"
                            style={{
                              background: idx === 0 ? 'var(--gold-500)' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : 'var(--bg-subtle)',
                              color: idx < 3 ? '#0A0A0A' : 'var(--text-tertiary)',
                            }}>
                            {idx + 1}
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">{emp.cashierId.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--text-gold)] tabular-nums">{formatCOP(emp.totalSales)}</td>
                      <td className="px-4 py-3 text-right text-[var(--text-secondary)] tabular-nums">{emp.totalOrders}</td>
                      <td className="px-4 py-3 text-right text-[var(--text-secondary)] tabular-nums">{formatCOP(emp.avgTicket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[var(--text-tertiary)]">Sin datos de empleados en el periodo seleccionado</div>
          )}
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string; loading?: boolean }) {
  return (
    <Card variant="default" padding="lg" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[rgba(201,168,76,0.12)] text-[var(--text-gold)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        {loading ? (
          <Skeleton variant="text" lines={1} />
        ) : (
          <p className="truncate text-xl font-semibold text-[var(--text-primary)]">{value}</p>
        )}
      </div>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] px-3 py-3">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatValue }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; formatValue: (value: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">{formatValue(payload[0].value)}</p>
    </div>
  );
}
