import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitRule } from './rate-limit.decorator';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const rule = this.reflector.getAllAndOverride<RateLimitRule>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rule) return true;

    const request = context.switchToHttp().getRequest<{
      ip?: string;
      headers?: Record<string, string | string[] | undefined>;
      body?: Record<string, unknown>;
      query?: Record<string, unknown>;
      params?: Record<string, unknown>;
      originalUrl?: string;
      path?: string;
    }>();

    const route = request.originalUrl ?? request.path ?? 'unknown-route';
    const ip = this.extractIp(request);
    const fieldKey = (rule.fields ?? [])
      .map((field) => this.normalizeValue(request.body?.[field] ?? request.query?.[field] ?? request.params?.[field]))
      .filter(Boolean)
      .join(':');

    const key = [route, ip, fieldKey].filter(Boolean).join('|');
    const result = this.rateLimitService.consume(key, rule.limit, rule.windowMs);

    if (!result.allowed) {
      throw new HttpException({
        error: 'Too many requests',
        retryAfterMs: result.retryAfterMs,
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private extractIp(request: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const headerValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    const firstForwardedIp = headerValue?.split(',')[0]?.trim();
    return firstForwardedIp ?? request.ip ?? 'unknown-ip';
  }

  private normalizeValue(value: unknown): string {
    if (typeof value === 'string' && value.trim()) return value.trim().toLowerCase();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }
}
