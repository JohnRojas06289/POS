import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales/summary')
  @ApiOperation({ summary: 'Sales summary with daily breakdown and payment method split' })
  salesSummary(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getSalesSummary({ from: dateFrom ?? from, to: dateTo ?? to, branchId });
  }

  @Get('products/performance')
  @ApiOperation({ summary: 'Top 10 by revenue, bottom 10 by rotation' })
  productPerformance() {
    return this.analyticsService.getProductPerformance();
  }

  @Get('inventory/valuation')
  @ApiOperation({ summary: 'Inventory valuation at CPP cost vs retail price' })
  inventoryValuation() {
    return this.analyticsService.getInventoryValuation();
  }

  @Get('customers/insights')
  @ApiOperation({ summary: 'Customer analytics: debt, top customers, purchase frequency' })
  customerInsights() {
    return this.analyticsService.getCustomerInsights();
  }
}
