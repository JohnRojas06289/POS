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

    await this.provisionSchema(dto.schemaName, tenantId, branchId, ownerId, dto.email, dto.businessName, passwordHash);

    return { tenantId, schemaName: dto.schemaName, requiresPayment: !isFree };
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
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${schemaName}"."Branch"
          (id, "tenantId", name, "isMain", "isActive", "createdAt", "updatedAt")
        VALUES
          ('${branchId}', '${tenantId}', 'Sucursal Principal', true, true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${schemaName}"."User"
          (id, email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt")
        VALUES
          ('${ownerId}', '${email}', '${passwordHash}', '${businessName}', 'owner', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "${schemaName}"."Terminal"
          (id, "branchId", name, "isActive", "createdAt", "updatedAt")
        VALUES
          ('${uuidv4()}', '${branchId}', 'Caja 1', true, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);
    } catch (error) {
      this.logger.error(`Schema provisioning failed for ${schemaName}: ${String(error)}`);
    }
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
}
