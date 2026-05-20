import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register-tenant')
  @ApiOperation({ summary: 'Register a new tenant and owner user' })
  async registerTenant(@Body() dto: RegisterTenantDto) {
    console.log('Register endpoint called with:', dto);
    try {
      const result = await this.authService.registerTenant(dto);
      console.log('Register success:', result);
      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('login-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with PIN (for cashiers offline)' })
  async loginPin(@Body() dto: LoginPinDto) {
    return this.authService.loginPin(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }
}
