import { Controller, Get, Post, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { OpenCashSessionDto } from './dto/open-session.dto';
import { CloseCashSessionDto } from './dto/close-session.dto';

interface AuthRequest {
  user: { sub: string; branchId: string };
}

@ApiTags('cash')
@ApiBearerAuth()
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post('sessions/open')
  @ApiOperation({ summary: 'Open a new cash session for a terminal' })
  open(@Body() dto: OpenCashSessionDto, @Request() req: AuthRequest) {
    return this.cashService.openSession(dto, req.user.sub, req.user.branchId);
  }

  @Get('sessions/current')
  @ApiOperation({ summary: 'Get the current open session for the authenticated terminal' })
  current(@Query('terminalId') terminalId: string) {
    return this.cashService.getCurrentSession(terminalId);
  }

  @Post('sessions/:id/close')
  @ApiOperation({ summary: 'Close a cash session with physical count' })
  close(@Param('id') id: string, @Body() dto: CloseCashSessionDto) {
    return this.cashService.closeSession(id, dto);
  }

  @Get('sessions/:id/summary')
  @ApiOperation({ summary: 'Get full summary of a closed cash session' })
  summary(@Param('id') id: string) {
    return this.cashService.getSessionSummary(id);
  }
}
