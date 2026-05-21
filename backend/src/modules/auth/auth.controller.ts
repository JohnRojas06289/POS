import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/security/rate-limit.decorator';
import { RateLimitGuard } from '../../common/security/rate-limit.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-tenant')
  @RateLimit({ limit: 5, windowMs: 15 * 60 * 1000, fields: ['email', 'tenantName'] })
  @ApiOperation({ summary: 'Register a new tenant and owner user' })
  async registerTenant(@Body() dto: RegisterTenantDto) {
    this.logger.log(`Register tenant request for ${dto.email}`);
    return this.authService.registerTenant(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowMs: 60 * 1000, fields: ['tenantEmail', 'email'] })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('login-pin')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 12, windowMs: 60 * 1000, fields: ['tenantId', 'branchId', 'deviceFingerprint'] })
  @ApiOperation({ summary: 'Login with PIN (for cashiers offline)' })
  async loginPin(@Body() dto: LoginPinDto) {
    return this.authService.loginPin(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  me(@CurrentUser() user: CurrentUserData) {
    return this.authService.me(user);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 20, windowMs: 60 * 1000 })
  @ApiOperation({ summary: 'Rotate refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Public()
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 5, windowMs: 15 * 60 * 1000, fields: ['tenantEmail', 'email'] })
  @ApiOperation({ summary: 'Request a password reset link' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, windowMs: 60 * 1000, fields: ['token'] })
  @ApiOperation({ summary: 'Reset a password with a recovery token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}
