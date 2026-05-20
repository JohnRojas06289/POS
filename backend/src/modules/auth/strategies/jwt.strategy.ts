import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  schemaName: string;
  role: string;
  branchId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'fallback-secret',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.tenantId || !payload.schemaName) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
