import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { assertValidSchemaName } from '../../common/utils/tenant-schema.util';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { RecordPayrollPaymentDto } from './dto/record-payroll-payment.dto';
import { v4 as uuidv4 } from 'uuid';

interface EmployeeRow {
  id: string;
  userId: string | null;
  branchId: string;
  branchName: string | null;
  name: string;
  documentNumber: string | null;
  position: string | null;
  salary: number | string | null;
  paymentFrequency: string;
  notes: string | null;
  isActive: boolean;
  hiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastPaidAt: Date | null;
  totalPaid: number | string | null;
}

interface PayrollPaymentRow {
  id: string;
  employeeId: string;
  amount: number | string;
  periodStart: Date | null;
  periodEnd: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    schemaName: string,
    filters: { branchId?: string; active?: string },
  ) {
    assertValidSchemaName(schemaName);

    const conditions: string[] = [];
    const params: Array<string | boolean> = [];

    if (filters.branchId) {
      params.push(filters.branchId);
      conditions.push(`e."branchId" = $${params.length}`);
    }

    if (filters.active === 'true' || filters.active === 'false') {
      params.push(filters.active === 'true');
      conditions.push(`e."isActive" = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT e.id, e."userId", e."branchId", b.name as "branchName", e.name, e."documentNumber",
              e.position, e.salary, e."paymentFrequency", e.notes, e."isActive", e."hiredAt",
              e."createdAt", e."updatedAt", pp."lastPaidAt", pp."totalPaid"
       FROM "${schemaName}"."Employee" e
       LEFT JOIN "${schemaName}"."Branch" b ON b.id = e."branchId"
       LEFT JOIN (
         SELECT "employeeId", MAX("createdAt") as "lastPaidAt", SUM(amount) as "totalPaid"
         FROM "${schemaName}"."PayrollPayment"
         GROUP BY "employeeId"
       ) pp ON pp."employeeId" = e.id
       ${whereClause}
       ORDER BY e."createdAt" DESC
       LIMIT 200`,
      ...params,
    ) as EmployeeRow[];

    return rows.map((row) => this.normalizeEmployee(row));
  }

  async create(
    schemaName: string,
    dto: CreateEmployeeDto,
    branchIdFromJwt: string | null,
  ) {
    assertValidSchemaName(schemaName);
    const branchId = dto.branchId ?? branchIdFromJwt;

    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }

    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${schemaName}"."Employee"
        (id, "userId", "branchId", name, "documentNumber", position, salary, "paymentFrequency", notes, "isActive", "hiredAt", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW(), NOW())`,
      id,
      dto.userId ?? null,
      branchId,
      dto.name,
      dto.documentNumber ?? null,
      dto.position ?? null,
      dto.salary ?? null,
      dto.paymentFrequency ?? 'monthly',
      dto.notes ?? null,
      dto.hiredAt ? new Date(dto.hiredAt) : null,
    );

    const employees = await this.list(schemaName, { branchId });
    const employee = employees.find((item) => item.id === id);
    if (!employee) {
      throw new NotFoundException('Employee could not be loaded after creation');
    }

    return employee;
  }

  async recordPayment(
    schemaName: string,
    employeeId: string,
    dto: RecordPayrollPaymentDto,
    createdBy: string,
  ) {
    assertValidSchemaName(schemaName);

    const employeeExists = await this.prisma.$queryRawUnsafe(
      `SELECT id FROM "${schemaName}"."Employee" WHERE id = $1 LIMIT 1`,
      employeeId,
    ) as Array<{ id: string }>;

    if (!employeeExists[0]) {
      throw new NotFoundException('Employee not found');
    }

    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${schemaName}"."PayrollPayment"
        (id, "employeeId", amount, "periodStart", "periodEnd", notes, "createdBy", "createdAt")
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      id,
      employeeId,
      dto.amount,
      dto.periodStart ? new Date(dto.periodStart) : null,
      dto.periodEnd ? new Date(dto.periodEnd) : null,
      dto.notes ?? null,
      createdBy,
    );

    const payment = await this.prisma.$queryRawUnsafe(
      `SELECT id, "employeeId", amount, "periodStart", "periodEnd", notes, "createdBy", "createdAt"
       FROM "${schemaName}"."PayrollPayment"
       WHERE id = $1
       LIMIT 1`,
      id,
    ) as PayrollPaymentRow[];

    return this.normalizePayment(payment[0]);
  }

  async getPayrollSummary(
    schemaName: string,
    filters: { from?: string; to?: string },
  ) {
    assertValidSchemaName(schemaName);

    const conditions: string[] = [];
    const params: Array<Date> = [];

    if (filters.from) {
      params.push(new Date(filters.from));
      conditions.push(`"createdAt" >= $${params.length}`);
    }
    if (filters.to) {
      params.push(new Date(filters.to));
      conditions.push(`"createdAt" <= $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT p.id, p."employeeId", p.amount, p."periodStart", p."periodEnd", p.notes, p."createdBy", p."createdAt",
              e.name
       FROM "${schemaName}"."PayrollPayment" p
       JOIN "${schemaName}"."Employee" e ON e.id = p."employeeId"
       ${whereClause}
       ORDER BY p."createdAt" DESC
       LIMIT 500`,
      ...params,
    ) as Array<PayrollPaymentRow & { name: string }>;

    const totalPaid = rows.reduce((sum, row) => sum + Number(row.amount), 0);
    const byEmployee = new Map<string, { employeeId: string; name: string; totalPaid: number; payments: number }>();

    for (const row of rows) {
      const current = byEmployee.get(row.employeeId) ?? {
        employeeId: row.employeeId,
        name: row.name,
        totalPaid: 0,
        payments: 0,
      };
      current.totalPaid += Number(row.amount);
      current.payments += 1;
      byEmployee.set(row.employeeId, current);
    }

    return {
      totalPaid,
      paymentsCount: rows.length,
      lastPaymentAt: rows[0]?.createdAt ?? null,
      byEmployee: Array.from(byEmployee.values()).sort((a, b) => b.totalPaid - a.totalPaid),
    };
  }

  private normalizeEmployee(row: EmployeeRow) {
    return {
      id: row.id,
      userId: row.userId,
      branchId: row.branchId,
      branchName: row.branchName,
      name: row.name,
      documentNumber: row.documentNumber,
      position: row.position,
      salary: row.salary === null ? null : Number(row.salary),
      paymentFrequency: row.paymentFrequency,
      notes: row.notes,
      isActive: row.isActive,
      hiredAt: row.hiredAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastPaidAt: row.lastPaidAt,
      totalPaid: row.totalPaid === null ? 0 : Number(row.totalPaid),
    };
  }

  private normalizePayment(row: PayrollPaymentRow | undefined) {
    if (!row) {
      throw new NotFoundException('Payroll payment not found');
    }

    return {
      id: row.id,
      employeeId: row.employeeId,
      amount: Number(row.amount),
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      notes: row.notes,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    };
  }
}
