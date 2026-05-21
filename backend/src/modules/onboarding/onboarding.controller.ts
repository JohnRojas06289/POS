import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RateLimitGuard } from '../../common/security/rate-limit.guard';
import { RateLimit } from '../../common/security/rate-limit.decorator';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(RateLimitGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('register')
  @Public()
  @RateLimit({ limit: 5, windowMs: 15 * 60 * 1000, fields: ['email', 'schemaName'] })
  @ApiOperation({ summary: 'Register a new tenant' })
  register(@Body() dto: RegisterTenantDto) {
    return this.onboardingService.registerTenant(dto);
  }

  @Get('check-schema')
  @Public()
  @RateLimit({ limit: 30, windowMs: 60 * 1000, fields: ['name'] })
  @ApiOperation({ summary: 'Check schema name availability' })
  checkSchema(@Query('name') name: string) {
    return this.onboardingService.checkSchemaAvailability(name);
  }

  @Get('status/:tenantId')
  @Public()
  @ApiOperation({ summary: 'Get onboarding status' })
  status(@Param('tenantId') tenantId: string) {
    return this.onboardingService.getOnboardingStatus(tenantId);
  }

  @Get('templates')
  @Public()
  @RateLimit({ limit: 20, windowMs: 60 * 1000 })
  @ApiOperation({ summary: 'List all business templates for onboarding' })
  getTemplates() {
    return this.onboardingService.getTemplates();
  }
}
