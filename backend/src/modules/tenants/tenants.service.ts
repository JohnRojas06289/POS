import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { assertValidSchemaName, ensureTenantSchemaTables } from '../../common/utils/tenant-schema.util';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

interface TenantConfigRow {
  value: unknown;
  posMode: string;
  paymentMethods: unknown;
  taxConfig: unknown;
  dianConfig: unknown;
  updatedAt: Date;
}

export interface TenantRoleConfig {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const DEFAULT_ROLE_CONFIGS: TenantRoleConfig[] = [
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

interface BranchRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  configOverride: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TerminalRow {
  id: string;
  branchId: string;
  branchName: string | null;
  name: string;
  type: string;
  deviceFingerprint: string | null;
  settings: unknown;
  isBlocked: boolean;
  isActive: boolean;
  branchConfigOverride: unknown;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tenant.findMany({ where: { isActive: true } });
  }

  async getTenantConfig(tenantId: string) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['TenantConfig']);
    const config = await this.getDefaultConfigRow(tenant.schemaName);
    const configValue = this.parseJson<Record<string, unknown>>(config?.value, {});

    return {
      name: String(configValue.businessName ?? tenant.name),
      slug: tenant.slug,
      email: tenant.email,
      schemaName: tenant.schemaName,
      isActive: tenant.isActive,
      nit: configValue.nit ?? null,
      whatsapp: configValue.whatsapp ?? tenant.phone ?? null,
      city: configValue.city ?? null,
      posMode: config?.posMode ?? 'retail',
      paymentMethods: this.parseJson<string[]>(config?.paymentMethods, ['cash']),
      taxConfig: this.parseJson<Record<string, unknown>>(config?.taxConfig, {}),
      dianConfig: this.parseJson<Record<string, unknown>>(config?.dianConfig, {}),
      roles: this.parseJson<TenantRoleConfig[]>(this.parseJson<Record<string, unknown>>(config?.value, {}).roles, DEFAULT_ROLE_CONFIGS),
      tipsEnabled: Boolean(configValue.tipsEnabled ?? false),
      tipPercentage: Number(configValue.tipPercentage ?? 10),
      hideOutOfStockProducts: Boolean(configValue.hideOutOfStockProducts ?? false),
      deliveryMethods: this.parseJson<string[]>(configValue.deliveryMethods, ['pickup', 'delivery']),
      openCashReminder: Boolean(configValue.openCashReminder ?? true),
      printerName: configValue.printerName ?? null,
      paperWidth: String(configValue.paperWidth ?? '80mm'),
      autoPrint: Boolean(configValue.autoPrint ?? false),
      menuUrl: configValue.menuUrl ?? `/tienda/${tenant.slug}`,
      updatedAt: config?.updatedAt ?? null,
    };
  }

  async updateTenantConfig(
    tenantId: string,
    data: {
      businessName?: string;
      nit?: string;
      whatsapp?: string;
      city?: string;
      posMode?: string;
      paymentMethods?: string[];
      taxConfig?: Record<string, unknown>;
      dianConfig?: Record<string, unknown>;
      roles?: TenantRoleConfig[];
      tipsEnabled?: boolean;
      tipPercentage?: number;
      hideOutOfStockProducts?: boolean;
      deliveryMethods?: string[];
      openCashReminder?: boolean;
      printerName?: string;
      paperWidth?: '58mm' | '80mm';
      autoPrint?: boolean;
      menuUrl?: string;
    },
  ) {
    const tenant = await this.getTenantRecord(tenantId);
    const existing = await this.getDefaultConfigRow(tenant.schemaName);
    const currentValue = this.parseJson<Record<string, unknown>>(existing?.value, {});
    const nextValue = {
      ...currentValue,
      businessName: data.businessName ?? currentValue.businessName ?? tenant.name,
      nit: data.nit ?? currentValue.nit ?? null,
      whatsapp: data.whatsapp ?? currentValue.whatsapp ?? tenant.phone ?? null,
      city: data.city ?? currentValue.city ?? null,
      defaultBranchId: currentValue.defaultBranchId ?? null,
      defaultTerminalId: currentValue.defaultTerminalId ?? null,
      roles: data.roles ?? this.parseJson<TenantRoleConfig[]>(currentValue.roles, DEFAULT_ROLE_CONFIGS),
      tipsEnabled: data.tipsEnabled ?? currentValue.tipsEnabled ?? false,
      tipPercentage: data.tipPercentage ?? currentValue.tipPercentage ?? 10,
      hideOutOfStockProducts: data.hideOutOfStockProducts ?? currentValue.hideOutOfStockProducts ?? false,
      deliveryMethods: data.deliveryMethods ?? this.parseJson<string[]>(currentValue.deliveryMethods, ['pickup', 'delivery']),
      openCashReminder: data.openCashReminder ?? currentValue.openCashReminder ?? true,
      printerName: data.printerName ?? currentValue.printerName ?? null,
      paperWidth: data.paperWidth ?? currentValue.paperWidth ?? '80mm',
      autoPrint: data.autoPrint ?? currentValue.autoPrint ?? false,
      menuUrl: data.menuUrl ?? currentValue.menuUrl ?? `/tienda/${tenant.slug}`,
    };

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${tenant.schemaName}"."TenantConfig"
        (id, key, value, "posMode", "paymentMethods", "taxConfig", "dianConfig", "updatedAt")
       VALUES
        ($1::uuid, 'default', $2::jsonb, $3, $4::jsonb, $5::jsonb, $6::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        "posMode" = EXCLUDED."posMode",
        "paymentMethods" = EXCLUDED."paymentMethods",
        "taxConfig" = EXCLUDED."taxConfig",
        "dianConfig" = EXCLUDED."dianConfig",
        "updatedAt" = NOW()`,
      existing ? this.extractId(existing) : uuidv4(),
      JSON.stringify(nextValue),
      data.posMode ?? existing?.posMode ?? 'retail',
      JSON.stringify(data.paymentMethods ?? this.parseJson<string[]>(existing?.paymentMethods, ['cash'])),
      JSON.stringify(data.taxConfig ?? this.parseJson<Record<string, unknown>>(existing?.taxConfig, {})),
      JSON.stringify(data.dianConfig ?? this.parseJson<Record<string, unknown>>(existing?.dianConfig, {})),
    );

    return this.getTenantConfig(tenantId);
  }

  async getTenantBranches(tenantId: string) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Branch', 'TenantConfig']);
    const config = await this.getDefaultConfigRow(tenant.schemaName);
    const defaultBranchId = this.parseJson<Record<string, unknown>>(config?.value, {}).defaultBranchId;

    const branches = await this.prisma.$queryRawUnsafe(
      `SELECT id, name, address, phone, "configOverride", "isActive", "createdAt", "updatedAt"
       FROM "${tenant.schemaName}"."Branch"
       ORDER BY "createdAt" ASC
       LIMIT 100`,
    ) as BranchRow[];

    return branches.map((branch) => ({
      ...branch,
      configOverride: this.parseJson<Record<string, unknown>>(branch.configOverride, {}),
      isMain: branch.id === defaultBranchId,
    }));
  }

  async getTenantUsers(tenantId: string) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Branch', 'User']);

    return this.prisma.$queryRawUnsafe(
      `SELECT u.id, u.name, u.email, u.role, u."branchId", u."isActive", u."createdAt", u."updatedAt",
              b.name as branch
       FROM "${tenant.schemaName}"."User" u
       LEFT JOIN "${tenant.schemaName}"."Branch" b ON b.id::text = u."branchId"::text
       ORDER BY u."createdAt" ASC
       LIMIT 100`,
    );
  }

  async createTenantUser(
    tenantId: string,
    data: { name: string; email: string; password: string; role: string; branchId?: string; pin?: string },
  ) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Branch', 'User']);
    if (!data.name || !data.email || !data.password || !data.role) {
      throw new BadRequestException('name, email, password and role are required');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const pinHash = data.pin ? await bcrypt.hash(data.pin, 10) : null;
    const id = uuidv4();

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${tenant.schemaName}"."User"
        (id, "branchId", email, "passwordHash", pin, name, role, "isActive", "createdAt", "updatedAt")
       VALUES
         ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, true, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      id,
      data.branchId ?? null,
      data.email,
      passwordHash,
      pinHash,
      data.name,
      data.role,
    );

    return {
      id,
      branchId: data.branchId ?? null,
      email: data.email,
      name: data.name,
      role: data.role,
      isActive: true,
    };
  }

  async updateTenantUser(
    tenantId: string,
    userId: string,
    data: { branchId?: string | null },
  ) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Branch', 'User']);

    await this.prisma.$executeRawUnsafe(
      `UPDATE "${tenant.schemaName}"."User"
       SET "branchId" = CASE WHEN $1::text IS NULL THEN NULL ELSE $1::uuid END, "updatedAt" = NOW()
       WHERE id = $2::uuid`,
      data.branchId ?? null,
      userId,
    );

    return { id: userId, branchId: data.branchId ?? null };
  }

  async createTenantBranch(
    tenantId: string,
    data: { name: string; address?: string; phone?: string; configOverride?: Record<string, unknown> },
  ) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Branch']);
    if (!data.name) {
      throw new BadRequestException('Branch name is required');
    }

    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${tenant.schemaName}"."Branch"
        (id, name, address, phone, "configOverride", "isActive", "createdAt", "updatedAt")
       VALUES
         ($1::uuid, $2, $3, $4, $5::jsonb, true, NOW(), NOW())`,
      id,
      data.name,
      data.address ?? null,
      data.phone ?? null,
      JSON.stringify(data.configOverride ?? {}),
    );

    return {
      id,
      name: data.name,
      address: data.address ?? null,
      phone: data.phone ?? null,
      configOverride: data.configOverride ?? {},
      isActive: true,
    };
  }

  async getTenantTerminals(tenantId: string) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Branch', 'Terminal', 'TenantConfig']);
    const baseConfig = await this.getTenantConfig(tenantId);

    const terminals = await this.prisma.$queryRawUnsafe(
      `SELECT t.id, t."branchId", b.name as "branchName", b."configOverride" as "branchConfigOverride",
              t.name, t.type, t."deviceFingerprint", t.settings, t."isBlocked", t."isActive",
              t."createdAt", t."updatedAt"
       FROM "${tenant.schemaName}"."Terminal" t
       LEFT JOIN "${tenant.schemaName}"."Branch" b ON b.id::text = t."branchId"::text
       ORDER BY t."createdAt" ASC
       LIMIT 100`,
    ) as TerminalRow[];

    return terminals.map((terminal) => ({
      id: terminal.id,
      branchId: terminal.branchId,
      branchName: terminal.branchName,
      name: terminal.name,
      type: terminal.type,
      deviceFingerprint: terminal.deviceFingerprint,
      isBlocked: terminal.isBlocked,
      isActive: terminal.isActive,
      settings: this.parseJson<Record<string, unknown>>(terminal.settings, {}),
      resolvedConfig: this.mergeResolvedConfig(
        {
          posMode: baseConfig.posMode,
          paymentMethods: baseConfig.paymentMethods,
          taxConfig: baseConfig.taxConfig,
          dianConfig: baseConfig.dianConfig,
        },
        this.parseJson<Record<string, unknown>>(terminal.branchConfigOverride, {}),
        this.parseJson<Record<string, unknown>>(terminal.settings, {}),
      ),
      createdAt: terminal.createdAt,
      updatedAt: terminal.updatedAt,
    }));
  }

  async createTenantTerminal(
    tenantId: string,
    data: {
      branchId: string;
      name: string;
      type?: string;
      deviceFingerprint?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Branch', 'Terminal']);
    if (!data.branchId || !data.name) {
      throw new BadRequestException('branchId and name are required');
    }

    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${tenant.schemaName}"."Terminal"
        (id, "branchId", name, type, "deviceFingerprint", settings, "isBlocked", "isActive", "createdAt", "updatedAt")
       VALUES
         ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, false, true, NOW(), NOW())`,
      id,
      data.branchId,
      data.name,
      data.type ?? 'pos',
      data.deviceFingerprint ?? null,
      JSON.stringify(data.settings ?? {}),
    );

    return {
      id,
      branchId: data.branchId,
      name: data.name,
      type: data.type ?? 'pos',
      deviceFingerprint: data.deviceFingerprint ?? null,
      settings: data.settings ?? {},
      isBlocked: false,
      isActive: true,
    };
  }

  async setTerminalBlocked(tenantId: string, terminalId: string, blocked: boolean) {
    const tenant = await this.getTenantRecord(tenantId);
    await ensureTenantSchemaTables(this.prisma, tenant.schemaName, ['Terminal']);
    const rows = await this.prisma.$queryRawUnsafe(
      `UPDATE "${tenant.schemaName}"."Terminal"
       SET "isBlocked" = $2, "updatedAt" = NOW()
       WHERE id = $1::uuid
       RETURNING id, "branchId", name, type, "deviceFingerprint", settings, "isBlocked", "isActive", "createdAt", "updatedAt"`,
      terminalId,
      blocked,
    ) as Array<{
      id: string;
      branchId: string;
      name: string;
      type: string;
      deviceFingerprint: string | null;
      settings: unknown;
      isBlocked: boolean;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;

    const terminal = rows[0];
    if (!terminal) {
      throw new NotFoundException('Terminal not found');
    }

    return {
      ...terminal,
      settings: this.parseJson<Record<string, unknown>>(terminal.settings, {}),
    };
  }

  private async getTenantRecord(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        schemaName: true,
        isActive: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    assertValidSchemaName(tenant.schemaName);
    return tenant;
  }

  private async getDefaultConfigRow(schemaName: string) {
    assertValidSchemaName(schemaName);
    const rows = await this.prisma.$queryRawUnsafe(
      `SELECT id, value, "posMode", "paymentMethods", "taxConfig", "dianConfig", "updatedAt"
       FROM "${schemaName}"."TenantConfig"
       WHERE key = 'default'
       LIMIT 1`,
    ) as Array<TenantConfigRow & { id: string }>;

    return rows[0] ?? null;
  }

  private extractId(config: TenantConfigRow & { id?: string }): string {
    return (config as TenantConfigRow & { id: string }).id;
  }

  private parseJson<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    if (typeof value === 'object') {
      return value as T;
    }
    return fallback;
  }

  private mergeResolvedConfig(
    baseConfig: Record<string, unknown>,
    branchOverride: Record<string, unknown>,
    terminalSettings: Record<string, unknown>,
  ) {
    return {
      ...baseConfig,
      ...branchOverride,
      ...terminalSettings,
      paymentMethods: terminalSettings.paymentMethods
        ?? branchOverride.paymentMethods
        ?? baseConfig.paymentMethods,
      taxConfig: {
        ...(this.parseJson<Record<string, unknown>>(baseConfig.taxConfig, {})),
        ...(this.parseJson<Record<string, unknown>>(branchOverride.taxConfig, {})),
        ...(this.parseJson<Record<string, unknown>>(terminalSettings.taxConfig, {})),
      },
      dianConfig: {
        ...(this.parseJson<Record<string, unknown>>(baseConfig.dianConfig, {})),
        ...(this.parseJson<Record<string, unknown>>(branchOverride.dianConfig, {})),
        ...(this.parseJson<Record<string, unknown>>(terminalSettings.dianConfig, {})),
      },
    };
  }
}
