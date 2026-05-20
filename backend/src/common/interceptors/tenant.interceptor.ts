import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  schemaName: string;
  role: string;
  branchId: string;
}

const PUBLIC_ROUTES = [
  '/health',
  '/auth/login',
  '/auth/register-tenant',
  '/auth/refresh',
  '/auth/login-pin',
  '/api/docs',
];

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      path: string;
      headers: Record<string, string>;
      user?: JwtPayload;
    }>();

    const isPublic = PUBLIC_ROUTES.some((route) =>
      request.path.startsWith(route),
    );

    if (isPublic) {
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

    const setSchema = this.prisma.$executeRawUnsafe(
      `SET search_path = "${schemaName}", public`,
    );

    return new Observable((subscriber) => {
      setSchema
        .then(() => {
          const handle = next.handle().pipe(
            finalize(() => {
              this.prisma.$executeRawUnsafe(
                'SET search_path = public',
              ).catch(() => {});
            }),
          );

          handle.subscribe({
            next: (val) => subscriber.next(val),
            error: (err: Error) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        })
        .catch((err: Error) => subscriber.error(err));
    });
  }
}
