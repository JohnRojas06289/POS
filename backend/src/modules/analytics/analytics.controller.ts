import { Controller, Get, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

interface AuthRequest {
  user: { sub: string; schemaName: string };
}

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales/summary')
  @ApiOperation({ summary: 'Sales summary with daily breakdown and payment method split' })
  salesSummary(
    @Request() req: AuthRequest,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.analyticsService.getSalesSummary(
      req.user.schemaName,
      { from: dateFrom ?? from, to: dateTo ?? to, branchId },
    );
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

  @Get('expenses')
  @ApiOperation({ summary: 'Expenses summary grouped by category with paid/pending split' })
  getExpensesSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.analyticsService.getExpensesSummary(req!.user.schemaName, dateFrom, dateTo, branchId);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Employee performance: total sales, orders and avg ticket per cashier' })
  getEmployeePerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.analyticsService.getEmployeePerformance(req!.user.schemaName, dateFrom, dateTo, branchId);
  }

  @Get('tips')
  @ApiOperation({ summary: 'Tips summary with daily trend and distribution by configured percentage' })
  getTipsSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.analyticsService.getTipsSummary(req!.user.schemaName, dateFrom, dateTo, branchId);
  }
}
