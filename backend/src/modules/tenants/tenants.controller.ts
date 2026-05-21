import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('config')
  @ApiBearerAuth()
  getConfig(@CurrentUser() user: CurrentUserData) {
    return this.tenantsService.getTenantConfig(user.tenantId);
  }

  @Get('branches')
  @ApiBearerAuth()
  getBranches(@CurrentUser() user: CurrentUserData) {
    return this.tenantsService.getTenantBranches(user.tenantId);
  }

  @Get('users')
  @ApiBearerAuth()
  getUsers(@CurrentUser() user: CurrentUserData) {
    return this.tenantsService.getTenantUsers(user.tenantId);
  }

  @Post('users')
  @ApiBearerAuth()
  async createUser(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { name: string; email: string; password: string; role: string; branchId?: string; pin?: string },
  ) {
    return this.tenantsService.createTenantUser(user.tenantId, body);
  }

  @Post('branches')
  @ApiBearerAuth()
  createBranch(@CurrentUser() user: CurrentUserData, @Body() body: { name: string; address?: string; phone?: string; configOverride?: Record<string, unknown> }) {
    return this.tenantsService.createTenantBranch(user.tenantId, body);
  }

  @Patch('config')
  @ApiBearerAuth()
  updateConfig(
    @CurrentUser() user: CurrentUserData,
    @Body() body: {
      businessName?: string;
      nit?: string;
      whatsapp?: string;
      city?: string;
      posMode?: string;
      paymentMethods?: string[];
      taxConfig?: Record<string, unknown>;
      dianConfig?: Record<string, unknown>;
      roles?: Array<{ id: string; name: string; description: string; permissions: string[] }>;
    },
  ) {
    return this.tenantsService.updateTenantConfig(user.tenantId, body);
  }

  @Get('terminals')
  @ApiBearerAuth()
  getTerminals(@CurrentUser() user: CurrentUserData) {
    return this.tenantsService.getTenantTerminals(user.tenantId);
  }

  @Post('terminals')
  @ApiBearerAuth()
  createTerminal(
    @CurrentUser() user: CurrentUserData,
    @Body() body: {
      branchId: string;
      name: string;
      type?: string;
      deviceFingerprint?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    return this.tenantsService.createTenantTerminal(user.tenantId, body);
  }

  @Patch('terminals/:id/block')
  @ApiBearerAuth()
  blockTerminal(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.tenantsService.setTerminalBlocked(user.tenantId, id, true);
  }

  @Patch('terminals/:id/unblock')
  @ApiBearerAuth()
  unblockTerminal(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.tenantsService.setTerminalBlocked(user.tenantId, id, false);
  }
}
