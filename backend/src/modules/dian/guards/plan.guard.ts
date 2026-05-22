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
    let killSwitch = false;

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { planSlug: string; killSwitch?: boolean };
        planSlug = parsed.planSlug;
        killSwitch = Boolean(parsed.killSwitch);
      } catch {
        planSlug = cached;
      }
    } else {
      const rows = await this.prisma.$queryRawUnsafe(
        `SELECT s."killSwitch", p.slug as "planSlug"
         FROM "public"."Subscription" s
         JOIN "public"."Plan" p ON p.id = s."planId"
         WHERE s."tenantId" = $1::uuid AND s.status = 'active'
         ORDER BY s."createdAt" DESC
         LIMIT 1`,
        tenantId,
      ) as Array<{ killSwitch: boolean; planSlug: string }>;

      const subscription = rows[0];
      if (!subscription) {
        throw new ForbiddenException('No active subscription found');
      }

      planSlug = subscription.planSlug;
      killSwitch = Boolean(subscription.killSwitch);
      await this.redis.set(cacheKey, JSON.stringify({ planSlug, killSwitch }), CACHE_TTL);
    }

    if (killSwitch) {
      throw new ForbiddenException('Subscription is blocked by kill-switch');
    }

    if (!ALLOWED_PLANS.includes(planSlug)) {
      throw new ForbiddenException(
        `DIAN module requires Starter plan or higher. Current plan: ${planSlug}`,
      );
    }

    return true;
  }
}
