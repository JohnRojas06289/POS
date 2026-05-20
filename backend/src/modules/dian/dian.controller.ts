import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DianService } from './dian.service';
import { PlanGuard } from './guards/plan.guard';

interface AuthRequest { user: { sub: string; tenantId: string } }

@ApiTags('dian')
@ApiBearerAuth()
@UseGuards(PlanGuard)
@Controller('dian')
export class DianController {
  constructor(private readonly dianService: DianService) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Generate electronic invoice for a completed order (UBL 2.1)' })
  generateInvoice(@Body('orderId') orderId: string, @Request() req: AuthRequest) {
    return this.dianService.generateInvoice(orderId, req.user.tenantId);
  }

  @Get('invoices/:orderId')
  @ApiOperation({ summary: 'Get DIAN document for an order' })
  getInvoice(@Param('orderId') orderId: string) {
    return this.dianService.getInvoiceByOrder(orderId);
  }

  @Post('credit-notes')
  @ApiOperation({ summary: 'Generate credit note (nota crédito) for a refund' })
  creditNote(
    @Body('originalOrderId') originalOrderId: string,
    @Body('refundOrderId') refundOrderId: string,
    @Body('reason') reason?: string,
  ) {
    return this.dianService.generateCreditNote(originalOrderId, refundOrderId, reason);
  }

  @Get('tax-summary')
  @ApiOperation({ summary: 'Tax summary for a period (for quarterly declaration)' })
  taxSummary(@Query('from') from: string, @Query('to') to: string) {
    return this.dianService.getTaxSummary(from, to);
  }
}
