import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

async function withSchema<T>(
  tx: Prisma.TransactionClient,
  schemaName: string,
  fn: () => Promise<T>,
): Promise<T> {
  await tx.$executeRawUnsafe(`SET LOCAL search_path = "${schemaName}", public`);
  return fn();
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveTenant(slug: string) {
    const tenant = await this.prisma.tenant.findFirst({ where: { slug } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug '${slug}' not found`);
    }
    return tenant;
  }

  async getPublicProducts(slug: string) {
    const tenant = await this.resolveTenant(slug);

    const products = await this.prisma.$transaction(async (tx) => {
      return withSchema(tx, tenant.schemaName, async () => {
        return tx.product.findMany({
          where: {
            isActive: true,
            variants: {
              some: {
                isActive: true,
                stock: { gt: 0 },
              },
            },
          },
          include: {
            variants: {
              where: {
                isActive: true,
                stock: { gt: 0 },
              },
              select: {
                id: true,
                sku: true,
                name: true,
                attributes: true,
                unitPrice: true,
                stock: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });
      });
    });

    return { products };
  }

  async getBusinessInfo(slug: string) {
    const tenant = await this.resolveTenant(slug);

    const config = await this.prisma.$transaction(async (tx) => {
      return withSchema(tx, tenant.schemaName, async () => {
        return tx.tenantConfig.findFirst();
      });
    });

    return {
      name: tenant.name,
      whatsapp: tenant.phone ?? null,
      country: tenant.country,
      currency: tenant.currency,
      businessType: tenant.businessType,
      posMode: config?.posMode ?? 'retail',
    };
  }
}
