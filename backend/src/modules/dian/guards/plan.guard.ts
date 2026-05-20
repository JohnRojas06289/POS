import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { RedisService } from '../../../database/redis/redis.service';

const ALLOWED_PLANS = ['starter', 'pro', 'enterprise'];
const CACHE_TTL = 5 * 60; // 5 minutes

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: { tenantId: string } }>();
    const { tenantId } = request.user;

    const cacheKey = `plan:${tenantId}`;
    const cached = await this.redis.get(cacheKey);

    let planSlug: string;

    if (cached) {
      planSlug = cached;
    } else {
      const subscription = await this.prisma.subscription.findFirst({
        where: { tenantId, status: 'active' },
        include: { plan: true },
      });

      if (!subscription) {
        throw new ForbiddenException('No active subscription found');
      }

      planSlug = subscription.plan.slug;
      await this.redis.set(cacheKey, planSlug, CACHE_TTL);
    }

    if (!ALLOWED_PLANS.includes(planSlug)) {
      throw new ForbiddenException(
        `DIAN module requires Starter plan or higher. Current plan: ${planSlug}`,
      );
    }

    return true;
  }
}
