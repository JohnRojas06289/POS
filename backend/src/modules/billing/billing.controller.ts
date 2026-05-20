import { Controller, Post, Get, Body, Headers, HttpCode, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Public } from '../../common/decorators/public.decorator';

interface AuthRequest { user: { sub: string; tenantId: string } }

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'List all available plans' })
  getPlans() {
    return this.billingService.getPlans();
  }

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Wompi checkout session' })
  createCheckout(@Body() dto: CreateSubscriptionDto, @Request() req: AuthRequest) {
    return this.billingService.createCheckoutSession(
      req.user.tenantId,
      dto.planId,
      dto.customerEmail,
      dto.customerName,
    );
  }

  @Get('subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription' })
  getSubscription(@Request() req: AuthRequest) {
    return this.billingService.getSubscription(req.user.tenantId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Wompi webhook receiver' })
  webhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-event-checksum') signature: string,
  ) {
    return this.billingService.handleWebhook(body, signature);
  }
}
