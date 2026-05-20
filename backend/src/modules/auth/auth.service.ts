import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { LoginPinDto } from './dto/login-pin.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  schemaName: string;
  role: string;
  branchId: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async registerTenant(dto: RegisterTenantDto): Promise<TokenPair> {
    const slug = dto.tenantName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const schemaName = `tenant_${slug}_${Date.now().toString(36)}`;

    const existing = await this.prisma.tenant.findFirst({
      where: { OR: [{ email: dto.email }, { slug }] },
    });

    if (existing) {
      throw new ConflictException('Tenant with this email or name already exists');
    }

    // Create tenant in global schema
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.tenantName,
        slug,
        schemaName,
        email: dto.email,
        country: dto.country ?? 'CO',
        timezone: dto.timezone ?? 'America/Bogota',
        currency: dto.currency ?? 'COP',
        businessType: dto.businessType ?? 'retail_clothing',
      },
    });

    // For now, create user in public schema (simplified, multi-schema later)
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    
    // We'll create a simple token for now - in production this would create user in tenant schema
    const user = { id: uuidv4(), email: dto.email, role: 'owner', branchId: null };
    return this.generateTokens(user.id, dto.email, tenant.id, 'public', 'owner', null);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { email: dto.tenantEmail },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Query user from tenant schema
    const users = await this.prisma.$queryRawUnsafe(
      `SELECT id, email, "passwordHash", role, "branchId", "isActive"
       FROM "${tenant.schemaName}"."User"
       WHERE email = $1 LIMIT 1`,
      dto.email,
    ) as Array<{
      id: string;
      email: string;
      passwordHash: string;
      role: string;
      branchId: string | null;
      isActive: boolean;
    }>;

    const user = users[0];
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(
      user.id,
      user.email,
      tenant.id,
      tenant.schemaName,
      user.role,
      user.branchId,
    );
  }

  async loginPin(dto: LoginPinDto): Promise<TokenPair> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const users = await this.prisma.$queryRawUnsafe(
      `SELECT id, email, pin, role, "branchId"
       FROM "${tenant.schemaName}"."User"
       WHERE "branchId" = $1 AND pin IS NOT NULL AND "isActive" = true`,
      dto.branchId,
    ) as Array<{
      id: string;
      email: string;
      pin: string;
      role: string;
      branchId: string | null;
    }>;

    const user = users.find((u) => {
      if (!u.pin) return false;
      return bcrypt.compareSync(dto.pin, u.pin);
    });

    if (!user) {
      throw new UnauthorizedException('Invalid PIN');
    }

    return this.generateTokens(
      user.id,
      user.email,
      tenant.id,
      tenant.schemaName,
      user.role,
      user.branchId,
    );
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const key = `refresh:${refreshToken.slice(0, 16)}`;
    const stored = await this.redis.get(key);

    if (!stored) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const payload = JSON.parse(stored) as JwtPayload;
    await this.redis.del(key);

    return this.generateTokens(
      payload.sub,
      payload.email,
      payload.tenantId,
      payload.schemaName,
      payload.role,
      payload.branchId,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const key = `refresh:${refreshToken.slice(0, 16)}`;
    await this.redis.del(key);
  }

  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
    schemaName: string,
    role: string,
    branchId: string | null,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      tenantId,
      schemaName,
      role,
      branchId: branchId ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4() + uuidv4();
    const key = `refresh:${refreshToken.slice(0, 16)}`;

    await this.redis.set(key, JSON.stringify(payload), this.REFRESH_TTL);

    return { accessToken, refreshToken };
  }
}
