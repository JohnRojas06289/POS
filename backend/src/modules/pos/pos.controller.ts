import {
  Controller, Get, Post, Patch, Param, Body, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';

interface AuthRequest {
  user: { sub: string; branchId: string; schemaName: string };
}

@ApiTags('pos')
@ApiBearerAuth()
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Create a new order (supports multi-payment, offline)' })
  createOrder(@Body() dto: CreateOrderDto, @Request() req: AuthRequest) {
    return this.posService.createOrder(dto, req.user.sub, req.user.schemaName);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List orders with filters and cursor pagination' })
  listOrders(
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('cashierId') cashierId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.posService.listOrders({
      status,
      dateFrom,
      dateTo,
      cashierId,
      limit: limit ? parseInt(limit, 10) : 20,
      cursor,
      branchId: req?.user?.branchId ?? '',
    }, req!.user.schemaName);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order detail with items and payments' })
  getOrder(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.posService.getOrder(id, req.user.schemaName);
  }

  @Patch('orders/:id/hold')
  @ApiOperation({ summary: 'Put order on hold' })
  holdOrder(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.posService.holdOrder(id, req.user.schemaName);
  }

  @Patch('orders/:id/resume')
  @ApiOperation({ summary: 'Resume a held order' })
  resumeOrder(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.posService.resumeOrder(id, req.user.schemaName);
  }

  @Post('orders/:id/refund')
  @ApiOperation({ summary: 'Refund order (partial or full)' })
  refundOrder(
    @Param('id') id: string,
    @Body() dto: RefundOrderDto,
    @Request() req: AuthRequest,
  ) {
    return this.posService.refundOrder(id, dto, req.user.sub, req.user.schemaName);
  }
}
