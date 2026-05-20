import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; tenant: null; timestamp: string } {
    return {
      status: 'ok',
      tenant: null,
      timestamp: new Date().toISOString(),
    };
  }
}
