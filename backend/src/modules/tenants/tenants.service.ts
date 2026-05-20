import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.tenant.findMany({ where: { isActive: true } });
  }
}
