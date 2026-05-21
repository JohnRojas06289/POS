import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  schemaName: string;
  role: string;
  branchId: string | null;
  terminalId?: string | null;
  deviceFingerprint?: string | null;
}

const PUBLIC_ROUTES = [
  '/health',
  '/api/docs',
];

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      path: string;
      headers: Record<string, string>;
      user?: JwtPayload;
    }>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isPublicByPath = PUBLIC_ROUTES.some((route) =>
      request.path === route || request.path.startsWith(`${route}/`),
    );

    if (isPublic || isPublicByPath) {
      return next.handle();
    }

    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { schemaName } = payload;

    if (!schemaName || !/^[a-z0-9_]+$/.test(schemaName)) {
      throw new UnauthorizedException('Invalid tenant schema');
    }

    request.user = payload;

    return next.handle();
  }
}
