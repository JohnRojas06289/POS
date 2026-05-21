import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { assertValidSchemaName, TENANT_TEMPLATE_TABLES } from '../../common/utils/tenant-schema.util';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

export interface TenantRoleConfig {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const DEFAULT_ROLE_CONFIGS: TenantRoleConfig[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Control total del negocio y configuración.',
    permissions: ['dashboard:read', 'inventory:write', 'orders:write', 'settings:write', 'users:write'],
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Administra operaciones y equipo.',
    permissions: ['dashboard:read', 'inventory:write', 'orders:read', 'users:read'],
  },
  {
    id: 'cashier',
    name: 'Cashier',
    description: 'Opera la caja y las ventas del POS.',
    permissions: ['dashboard:read', 'orders:write', 'customers:read'],
  },
];

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
  terminalId?: string | null;
  deviceFingerprint?: string | null;
}

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  branchId: string | null;
  terminalId: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    schemaName: string;
  };
  branch: {
    id: string;
    name: string;
  } | null;
}

interface ResolvedTerminal {
  id: string;
  branchId: string;
  isActive: boolean;
  isBlocked: boolean;
  deviceFingerprint: string | null;
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
    assertValidSchemaName(schemaName);

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

    // Provision tenant schema and create owner user
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const userId = uuidv4();
    await this.provisionTenantSchema(schemaName, userId, dto.email, dto.ownerName ?? dto.tenantName, passwordHash);

    return this.generateTokens(userId, dto.email, tenant.id, schemaName, 'owner', null);
  }

  private async provisionTenantSchema(
    schemaName: string,
    userId: string,
    email: string,
    name: string,
    passwordHash: string,
  ): Promise<void> {
    assertValidSchemaName(schemaName);

    await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    for (const table of TENANT_TEMPLATE_TABLES) {
      await this.prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "${schemaName}"."${table}" (LIKE "tenant"."${table}" INCLUDING ALL)`,
      );
    }

    const branchId = uuidv4();
    const terminalId = uuidv4();
    const configId = uuidv4();

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${schemaName}"."Branch" (id, name, address, phone, "configOverride", "isActive", "createdAt", "updatedAt")
       VALUES ($1, 'Sucursal Principal', NULL, NULL, '{}'::jsonb, true, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      branchId,
    );

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${schemaName}"."User" (id, "branchId", email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, NULL, $2, $3, $4, 'owner', true, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      userId,
      email,
      passwordHash,
      name,
    );

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${schemaName}"."Terminal"
        (id, "branchId", name, type, "deviceFingerprint", settings, "isBlocked", "isActive", "createdAt", "updatedAt")
       VALUES
        ($1, $2, 'Caja Principal', 'pos', NULL, '{}'::jsonb, false, true, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      terminalId,
      branchId,
    );

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "${schemaName}"."TenantConfig"
        (id, key, value, "posMode", "paymentMethods", "taxConfig", "dianConfig", "updatedAt")
       VALUES
        ($1, 'default', $2::jsonb, 'retail', $3::jsonb, $4::jsonb, $5::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        "posMode" = EXCLUDED."posMode",
        "paymentMethods" = EXCLUDED."paymentMethods",
        "taxConfig" = EXCLUDED."taxConfig",
        "dianConfig" = EXCLUDED."dianConfig",
        "updatedAt" = NOW()`,
      configId,
      JSON.stringify({
        businessName: name,
        defaultBranchId: branchId,
        defaultTerminalId: terminalId,
        roles: DEFAULT_ROLE_CONFIGS,
      }),
      JSON.stringify(['cash', 'nequi', 'daviplata']),
      JSON.stringify({ defaultRate: 0.19 }),
      JSON.stringify({ currentInvoiceNumber: 1 }),
    );
  }

  async me(user: CurrentUserData): Promise<AuthProfile> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, name: true, slug: true, schemaName: true, isActive: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant is inactive');
    }

    assertValidSchemaName(tenant.schemaName);

    const users = await this.prisma.$queryRawUnsafe(
      `SELECT id, name, email, role, "branchId", "isActive"
       FROM "${tenant.schemaName}"."User"
       WHERE id = $1
       LIMIT 1`,
      user.sub,
    ) as Array<{ id: string; name: string; email: string; role: string; branchId: string | null; isActive: boolean }>;

    const profile = users[0];
    if (!profile || !profile.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    let branch: AuthProfile['branch'] = null;
    if (profile.branchId) {
      const branches = await this.prisma.$queryRawUnsafe(
        `SELECT id, name
         FROM "${tenant.schemaName}"."Branch"
         WHERE id = $1
         LIMIT 1`,
        profile.branchId,
      ) as Array<{ id: string; name: string }>;
      branch = branches[0] ?? null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      branchId: profile.branchId,
      terminalId: user.terminalId ?? null,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        schemaName: tenant.schemaName,
      },
      branch,
    };
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { email: dto.tenantEmail },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.assertTenantAccess(tenant.id, tenant.isActive);
    assertValidSchemaName(tenant.schemaName);

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

    await this.assertTenantAccess(tenant.id, tenant.isActive);
    assertValidSchemaName(tenant.schemaName);

    const terminal = await this.resolveTerminalForPin(tenant.schemaName, dto);

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
      terminal.id,
      terminal.deviceFingerprint,
    );
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const key = `refresh:${this.hashRefreshToken(refreshToken)}`;
    const stored = await this.redis.get(key);

    if (!stored) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const payload = JSON.parse(stored) as JwtPayload;
    await this.redis.del(key);

    await this.assertTenantAccess(payload.tenantId);

    if (payload.terminalId) {
      await this.assertTerminalActive(
        payload.schemaName,
        payload.terminalId,
        payload.deviceFingerprint ?? null,
      );
    }

    return this.generateTokens(
      payload.sub,
      payload.email,
      payload.tenantId,
      payload.schemaName,
      payload.role,
      payload.branchId,
      payload.terminalId ?? null,
      payload.deviceFingerprint ?? null,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const key = `refresh:${this.hashRefreshToken(refreshToken)}`;
    await this.redis.del(key);
  }

  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
    schemaName: string,
    role: string,
    branchId: string | null,
    terminalId?: string | null,
    deviceFingerprint?: string | null,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      tenantId,
      schemaName,
      role,
      branchId: branchId ?? null,
      terminalId: terminalId ?? null,
      deviceFingerprint: deviceFingerprint ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4() + uuidv4();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const key = `refresh:${refreshTokenHash}`;

    await this.redis.set(key, JSON.stringify(payload), this.REFRESH_TTL);

    return { accessToken, refreshToken };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  private async assertTenantAccess(tenantId: string, isActiveOverride?: boolean): Promise<void> {
    const tenant = isActiveOverride === undefined
      ? await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { isActive: true },
      })
      : { isActive: isActiveOverride };

    if (!tenant?.isActive) {
      throw new UnauthorizedException('Tenant is inactive');
    }

    try {
      const subscriptions = await this.prisma.$queryRawUnsafe(
        `SELECT "killSwitch"
         FROM "public"."Subscription"
         WHERE "tenantId" = $1 AND status = 'active'
         ORDER BY "createdAt" DESC
         LIMIT 1`,
        tenantId,
      ) as Array<{ killSwitch: boolean }>;

      if (subscriptions[0]?.killSwitch) {
        throw new UnauthorizedException('Tenant access is blocked');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }

      this.logger.warn(
        `Skipping subscription gate in development: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async resolveTerminalForPin(schemaName: string, dto: LoginPinDto): Promise<ResolvedTerminal> {
    assertValidSchemaName(schemaName);

    if (dto.terminalId) {
      const terminals = await this.prisma.$queryRawUnsafe(
        `SELECT id, "branchId", "isActive", "isBlocked", "deviceFingerprint"
         FROM "${schemaName}"."Terminal"
         WHERE id = $1
         LIMIT 1`,
        dto.terminalId,
      ) as ResolvedTerminal[];

      const terminal = terminals[0];
      if (!terminal || terminal.branchId !== dto.branchId) {
        throw new UnauthorizedException('Terminal not found for this branch');
      }

      if (dto.deviceFingerprint && !terminal.deviceFingerprint) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE "${schemaName}"."Terminal"
           SET "deviceFingerprint" = $2, "updatedAt" = NOW()
           WHERE id = $1`,
          terminal.id,
          dto.deviceFingerprint,
        );
        terminal.deviceFingerprint = dto.deviceFingerprint;
      }

      this.ensureTerminalAllowed(terminal, dto.deviceFingerprint ?? null);
      return terminal;
    }

    if (dto.deviceFingerprint) {
      const terminals = await this.prisma.$queryRawUnsafe(
        `SELECT id, "branchId", "isActive", "isBlocked", "deviceFingerprint"
         FROM "${schemaName}"."Terminal"
         WHERE "deviceFingerprint" = $1
         LIMIT 1`,
        dto.deviceFingerprint,
      ) as ResolvedTerminal[];

      const existing = terminals[0];
      if (existing) {
        if (existing.branchId !== dto.branchId) {
          throw new UnauthorizedException('Device is assigned to another branch');
        }
        this.ensureTerminalAllowed(existing, dto.deviceFingerprint);
        return existing;
      }

      const terminalId = uuidv4();
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "${schemaName}"."Terminal"
          (id, "branchId", name, type, "deviceFingerprint", settings, "isBlocked", "isActive", "createdAt", "updatedAt")
         VALUES
          ($1, $2, $3, 'mobile_pos', $4, '{}'::jsonb, false, true, NOW(), NOW())`,
        terminalId,
        dto.branchId,
        dto.terminalName ?? 'Terminal móvil',
        dto.deviceFingerprint,
      );

      return {
        id: terminalId,
        branchId: dto.branchId,
        isActive: true,
        isBlocked: false,
        deviceFingerprint: dto.deviceFingerprint,
      };
    }

    throw new UnauthorizedException('Terminal identification is required');
  }

  private async assertTerminalActive(
    schemaName: string,
    terminalId: string,
    deviceFingerprint: string | null,
  ): Promise<void> {
    assertValidSchemaName(schemaName);
    const terminals = await this.prisma.$queryRawUnsafe(
      `SELECT id, "branchId", "isActive", "isBlocked", "deviceFingerprint"
       FROM "${schemaName}"."Terminal"
       WHERE id = $1
       LIMIT 1`,
      terminalId,
    ) as ResolvedTerminal[];

    const terminal = terminals[0];
    if (!terminal) {
      throw new UnauthorizedException('Terminal no longer exists');
    }

    this.ensureTerminalAllowed(terminal, deviceFingerprint);
  }

  private ensureTerminalAllowed(terminal: ResolvedTerminal, deviceFingerprint: string | null): void {
    if (!terminal.isActive || terminal.isBlocked) {
      throw new UnauthorizedException('Terminal is blocked');
    }

    if (terminal.deviceFingerprint && deviceFingerprint && terminal.deviceFingerprint !== deviceFingerprint) {
      throw new UnauthorizedException('Device fingerprint mismatch');
    }
  }
}
