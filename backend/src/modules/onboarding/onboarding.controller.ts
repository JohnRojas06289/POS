import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new tenant' })
  register(@Body() dto: RegisterTenantDto) {
    return this.onboardingService.registerTenant(dto);
  }

  @Get('check-schema')
  @Public()
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
}
