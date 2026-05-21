'use client';

import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';

const mockSuppliers = [
  { id: 'SUP-001', name: 'Distribuidora Central', status: 'Activo', openPo: 3 },
  { id: 'SUP-002', name: 'Lácteos del Valle', status: 'Activo', openPo: 1 },
  { id: 'SUP-003', name: 'Empaques Bogotá', status: 'En negociación', openPo: 0 },
];

export default function SuppliersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--text-primary]">Proveedores</h1>
        <p className="text-sm text-[--text-secondary] mt-0.5">
          Gestión de proveedores y órdenes de compra.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card variant="default" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[--text-primary]">Lista de proveedores</h2>
            <span className="text-xs text-[--text-tertiary]">Demo conectada a backend pendiente</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[--border] text-left text-[--text-tertiary]">
                  <th className="py-3 font-medium">Proveedor</th>
                  <th className="py-3 font-medium">Estado</th>
                  <th className="py-3 font-medium text-right">OC abiertas</th>
                </tr>
              </thead>
              <tbody>
                {mockSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-[--border] last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-[--text-primary]">{supplier.name}</p>
                      <p className="text-xs text-[--text-tertiary]">{supplier.id}</p>
                    </td>
                    <td className="py-3 text-[--text-secondary]">{supplier.status}</td>
                    <td className="py-3 text-right font-semibold text-[--text-primary]">{supplier.openPo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card variant="default" padding="lg" className="space-y-3">
          <h2 className="text-base font-semibold text-[--text-primary]">Órdenes de compra</h2>
          <p className="text-sm text-[--text-secondary]">
            Resumen rápido de órdenes pendientes por recibir.
          </p>
          <Skeleton variant="text" lines={4} />
        </Card>
      </div>
    </div>
  );
}
