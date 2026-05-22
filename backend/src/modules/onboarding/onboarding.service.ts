import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { assertValidSchemaName, TENANT_TEMPLATE_TABLES } from '../../common/utils/tenant-schema.util';
import { withRetry, withTimeout } from '../../common/utils/resilience.util';

export interface OnboardingResult {
  tenantId: string;
  schemaName: string;
  requiresPayment: boolean;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerTenant(dto: RegisterTenantDto): Promise<OnboardingResult> {
    assertValidSchemaName(dto.schemaName);

    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ email: dto.email }, { schemaName: dto.schemaName }],
      },
    });

    if (existing) {
      if (existing.email === dto.email) throw new ConflictException('Email already registered');
      throw new ConflictException('Schema name already taken');
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new BadRequestException('Invalid plan');

    const tenantId = uuidv4();
    const branchId = uuidv4();
    const ownerId = uuidv4();
    const passwordHash = await hash(dto.password, 12);
    const isFree = Number(plan.price) === 0;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.tenant.create({
          data: {
            id: tenantId,
            name: dto.businessName,
            slug: dto.schemaName,
            email: dto.email,
            phone: dto.phone,
            schemaName: dto.schemaName,
            isActive: isFree,
          },
        });

        await tx.subscription.create({
          data: {
            id: uuidv4(),
            tenantId,
            planId: dto.planId,
            status: isFree ? 'active' : 'pending',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${dto.schemaName}"`);
      });

      await withRetry(
        () => withTimeout(
          () => this.provisionSchema(dto.schemaName, tenantId, branchId, ownerId, dto.email, dto.businessName, passwordHash),
          30_000,
          `Schema provisioning timed out for ${dto.schemaName}`,
        ),
        { retries: 1, delayMs: 250 },
      );

      return { tenantId, schemaName: dto.schemaName, requiresPayment: !isFree };
    } catch (error) {
      await this.rollbackTenantProvision(dto.schemaName, tenantId);
      this.logger.error(
        `Onboarding failed for ${dto.schemaName}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private async provisionSchema(
    schemaName: string,
    tenantId: string,
    branchId: string,
    ownerId: string,
    email: string,
    businessName: string,
    passwordHash: string,
  ): Promise<void> {
    try {
      assertValidSchemaName(schemaName);

      for (const table of TENANT_TEMPLATE_TABLES) {
        await this.prisma.$executeRawUnsafe(
          `CREATE TABLE IF NOT EXISTS "${schemaName}"."${table}" (LIKE "tenant"."${table}" INCLUDING ALL)`,
        );
      }

      const terminalId = uuidv4();
      const configId = uuidv4();

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${schemaName}"."Branch"
          (id, name, "isActive", "configOverride", "createdAt", "updatedAt")
        VALUES
          ('${branchId}', 'Sucursal Principal', true, '{}'::jsonb, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "${schemaName}"."User"
          (id, "branchId", email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt")
         VALUES
          ($1::uuid, NULL, $2, $3, $4, 'owner', true, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        ownerId,
        email,
        passwordHash,
        businessName,
      );

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "${schemaName}"."Terminal"
          (id, "branchId", name, type, "deviceFingerprint", settings, "isBlocked", "isActive", "createdAt", "updatedAt")
         VALUES
          ($1::uuid, $2::uuid, 'Caja Principal', 'pos', NULL, '{}'::jsonb, false, true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        terminalId,
        branchId,
      );

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "${schemaName}"."TenantConfig"
          (id, key, value, "posMode", "paymentMethods", "taxConfig", "dianConfig", "updatedAt")
         VALUES
          ($1::uuid, 'default', $2::jsonb, 'retail', $3::jsonb, $4::jsonb, $5::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          "paymentMethods" = EXCLUDED."paymentMethods",
          "taxConfig" = EXCLUDED."taxConfig",
          "dianConfig" = EXCLUDED."dianConfig",
          "updatedAt" = NOW()`,
        configId,
        JSON.stringify({ businessName, tenantId, defaultBranchId: branchId, defaultTerminalId: terminalId }),
        JSON.stringify(['cash', 'nequi', 'daviplata']),
        JSON.stringify({ defaultRate: 0.19 }),
        JSON.stringify({ currentInvoiceNumber: 1 }),
      );
    } catch (error) {
      this.logger.error(`Schema provisioning failed for ${schemaName}: ${String(error)}`);
      throw error;
    }
  }

  async getTemplates() {
    return this.prisma.businessTemplate.findMany({
      select: { slug: true, name: true, description: true, config: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async checkSchemaAvailability(schemaName: string): Promise<{ available: boolean }> {
    if (!/^[a-z0-9_]+$/.test(schemaName) || schemaName.length < 3) {
      return { available: false };
    }
    const existing = await this.prisma.tenant.findFirst({ where: { schemaName } });
    return { available: !existing };
  }

  async getOnboardingStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: { include: { plan: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');
    return {
      tenantId: tenant.id,
      isActive: tenant.isActive,
      schemaName: tenant.schemaName,
      subscription: tenant.subscriptions[0] ?? null,
    };
  }

  private async rollbackTenantProvision(schemaName: string, tenantId: string): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    } catch (error) {
      this.logger.warn(
        `Failed to drop schema ${schemaName} during onboarding rollback: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      await this.prisma.subscription.deleteMany({ where: { tenantId } });
      await this.prisma.tenant.deleteMany({ where: { id: tenantId } });
    } catch (error) {
      this.logger.warn(
        `Failed to delete tenant ${tenantId} during onboarding rollback: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
