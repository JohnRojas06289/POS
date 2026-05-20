import { Controller, Get } from '@nestjs/common';
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
}
