import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tenant.findMany({ where: { isActive: true } });
  }

  async getTenantConfig(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, schemaName: true, isActive: true, settings: true },
    });
  }

  async getTenantBranches(tenantId: string) {
    return this.prisma.$queryRawUnsafe(
      `SELECT id, name, address, "isMain", "isActive" FROM branches WHERE "tenantId" = $1 LIMIT 50`,
      tenantId,
    );
  }

  async getTenantUsers(tenantId: string) {
    return this.prisma.$queryRawUnsafe(
      `SELECT id, name, email, role, "isActive" FROM users WHERE "tenantId" = $1 LIMIT 50`,
      tenantId,
    );
  }
}
