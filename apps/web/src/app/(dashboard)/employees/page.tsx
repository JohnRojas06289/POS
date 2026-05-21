'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Search, UserPlus, Wallet } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { employeesApi, tenantsApi } from '../../../lib/api';
import { useToast } from '../../../components/ui/Toast';

type Employee = {
  id: string;
  branchId: string;
  branchName?: string | null;
  name: string;
  documentNumber?: string | null;
  position?: string | null;
  salary?: number | null;
  paymentFrequency: string;
  notes?: string | null;
  isActive: boolean;
  hiredAt?: string | null;
  lastPaidAt?: string | null;
  totalPaid: number;
};

type PayrollSummary = {
  totalPaid: number;
  paymentsCount: number;
  lastPaymentAt?: string | null;
  byEmployee: Array<{ employeeId: string; name: string; totalPaid: number; payments: number }>;
};

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function NewEmployeeModal({
  branches,
  onClose,
  onSave,
}: {
  branches: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !branchId) return;
    setSaving(true);
    try {
      await employeesApi.createEmployee({
        name,
        branchId,
        position: position || undefined,
        salary: salary ? Number(salary) : undefined,
        documentNumber: documentNumber || undefined,
      });
      toast('Empleado creado exitosamente', 'success');
      onSave();
    } catch {
      toast('Error al crear el empleado', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-[--radius-lg] bg-[--bg-primary] shadow-[--shadow-lg]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[--border] p-5">
          <h3 className="font-semibold text-[--text-primary]">Nuevo empleado</h3>
          <button onClick={onClose} className="text-[--text-tertiary]" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Nombre *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Sucursal *</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]">
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Cargo</label>
              <input value={position} onChange={(e) => setPosition(e.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Salario base</label>
              <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Documento</label>
            <input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[--border] p-5">
          <button onClick={onClose} className="rounded-[--radius-md] bg-[--bg-tertiary] px-4 py-2 text-sm text-[--text-secondary]">Cancelar</button>
          <button onClick={handleSave} disabled={!name || !branchId || saving} className="rounded-[--radius-md] bg-[--nexus-500] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function PayrollModal({
  employee,
  onClose,
  onSave,
}: {
  employee: Employee;
  onClose: () => void;
  onSave: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(employee.salary ? String(employee.salary) : '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await employeesApi.recordPayment(employee.id, { amount: Number(amount), notes });
      toast('Pago de nómina registrado', 'success');
      onSave();
    } catch {
      toast('Error al registrar el pago', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[--radius-lg] bg-[--bg-primary] shadow-[--shadow-lg]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[--border] p-5">
          <h3 className="font-semibold text-[--text-primary]">Pago de nómina — {employee.name}</h3>
          <button onClick={onClose} className="text-[--text-tertiary]" aria-label="Cerrar">✕</button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Monto</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[--text-secondary]">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[96px] w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] px-3 py-2 text-sm text-[--text-primary]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[--border] p-5">
          <button onClick={onClose} className="rounded-[--radius-md] bg-[--bg-tertiary] px-4 py-2 text-sm text-[--text-secondary]">Cancelar</button>
          <button onClick={handleSave} disabled={!amount || Number(amount) <= 0 || saving} className="rounded-[--radius-md] bg-[--nexus-500] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Registrar pago</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [newEmployeeOpen, setNewEmployeeOpen] = useState(false);
  const [payrollEmployee, setPayrollEmployee] = useState<Employee | null>(null);

  const { data: employeesData, isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.getEmployees(),
    retry: 1,
  });

  const { data: payrollSummary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['employees-payroll-summary'],
    queryFn: () => employeesApi.getPayrollSummary(),
    retry: 1,
  });

  const { data: branchesData } = useQuery({
    queryKey: ['tenant-branches-for-employees'],
    queryFn: () => tenantsApi.getBranches(),
    retry: 1,
  });

  const employees: Employee[] = Array.isArray(employeesData) ? employeesData : [];
  const summary = (payrollSummary ?? { totalPaid: 0, paymentsCount: 0, byEmployee: [] }) as PayrollSummary;
  const branches = Array.isArray(branchesData) ? branchesData : [];

  const filtered = useMemo(
    () => employees.filter((employee) =>
      employee.name.toLowerCase().includes(search.toLowerCase())
      || (employee.position ?? '').toLowerCase().includes(search.toLowerCase())
      || (employee.branchName ?? '').toLowerCase().includes(search.toLowerCase()),
    ),
    [employees, search],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--text-primary]">Empleados y nómina</h1>
          <p className="mt-0.5 text-sm text-[--text-secondary]">{employees.length} empleados registrados</p>
        </div>
        <button onClick={() => setNewEmployeeOpen(true)} className="inline-flex items-center gap-2 rounded-[--radius-md] bg-[--nexus-500] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
          <UserPlus size={16} /> Nuevo empleado
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card variant="default" padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[--text-secondary]">Nómina pagada</p>
              {loadingSummary ? <Skeleton variant="text" lines={2} /> : <p className="mt-2 text-2xl font-bold text-[--text-primary]">{formatCOP(summary.totalPaid)}</p>}
            </div>
            <Wallet className="text-[--nexus-500]" size={20} />
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[--text-secondary]">Pagos registrados</p>
              {loadingSummary ? <Skeleton variant="text" lines={2} /> : <p className="mt-2 text-2xl font-bold text-[--text-primary]">{summary.paymentsCount}</p>}
            </div>
            <Banknote className="text-[--success]" size={20} />
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div>
            <p className="text-sm text-[--text-secondary]">Top pagado</p>
            {loadingSummary ? (
              <Skeleton variant="text" lines={2} />
            ) : summary.byEmployee[0] ? (
              <>
                <p className="mt-2 font-semibold text-[--text-primary]">{summary.byEmployee[0].name}</p>
                <p className="text-sm text-[--text-secondary]">{formatCOP(summary.byEmployee[0].totalPaid)}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[--text-tertiary]">Sin pagos aún</p>
            )}
          </div>
        </Card>
      </div>

      <Card variant="default" padding="md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--text-tertiary]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cargo o sucursal..."
            className="w-full rounded-[--radius-md] border border-[--border] bg-[--bg-primary] py-2 pl-9 pr-3 text-sm text-[--text-primary] focus:outline-none focus:border-[--nexus-500]"
          />
        </div>
      </Card>

      <Card variant="default" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[--border] text-left text-xs text-[--text-tertiary]">
                <th className="px-4 py-3 font-medium">Empleado</th>
                <th className="px-4 py-3 font-medium">Sucursal</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3 font-medium">Salario</th>
                <th className="px-4 py-3 font-medium">Pagado acumulado</th>
                <th className="px-4 py-3 font-medium">Último pago</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3" colSpan={8}><Skeleton variant="table-row" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[--bg-secondary]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[--text-primary]">{employee.name}</p>
                      <p className="text-xs text-[--text-tertiary]">{employee.documentNumber || 'Sin documento'}</p>
                    </td>
                    <td className="px-4 py-3 text-[--text-secondary]">{employee.branchName || '—'}</td>
                    <td className="px-4 py-3 text-[--text-secondary]">{employee.position || '—'}</td>
                    <td className="px-4 py-3 text-[--text-primary]">{employee.salary ? formatCOP(employee.salary) : '—'}</td>
                    <td className="px-4 py-3 text-[--text-primary]">{formatCOP(employee.totalPaid)}</td>
                    <td className="px-4 py-3 text-[--text-secondary]">{employee.lastPaidAt ? new Date(employee.lastPaidAt).toLocaleDateString('es-CO') : 'Sin pagos'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${employee.isActive ? 'bg-green-100 text-green-700' : 'bg-[--bg-tertiary] text-[--text-tertiary]'}`}>
                        {employee.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setPayrollEmployee(employee)} className="rounded-[--radius-md] border border-[--border] px-3 py-1.5 text-xs font-medium text-[--text-secondary] hover:border-[--nexus-500] hover:text-[--nexus-500]">
                        Registrar pago
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[--text-tertiary]">No hay empleados registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {newEmployeeOpen && (
        <NewEmployeeModal
          branches={branches}
          onClose={() => setNewEmployeeOpen(false)}
          onSave={() => {
            void refetch();
            void refetchSummary();
            setNewEmployeeOpen(false);
          }}
        />
      )}

      {payrollEmployee && (
        <PayrollModal
          employee={payrollEmployee}
          onClose={() => setPayrollEmployee(null)}
          onSave={() => {
            void refetch();
            void refetchSummary();
            setPayrollEmployee(null);
          }}
        />
      )}
    </div>
  );
}
