import { Controller, Get, Post, Patch, Param, Body, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/create-purchase-order.dto';

interface AuthRequest { user: { sub: string } }

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a supplier' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers with total owed' })
  findAll() {
    return this.suppliersService.findAll();
  }

  @Post(':id/purchase-orders')
  @ApiOperation({ summary: 'Create a purchase order for a supplier' })
  createOrder(
    @Param('id') id: string,
    @Body() dto: CreatePurchaseOrderDto,
    @Request() req: AuthRequest,
  ) {
    return this.suppliersService.createPurchaseOrder(id, dto, req.user.sub);
  }

  @Patch(':id/purchase-orders/:orderId/receive')
  @ApiOperation({ summary: 'Mark purchase order as received, update stock and CPP' })
  receiveOrder(
    @Param('id') id: string,
    @Param('orderId') orderId: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @Request() req: AuthRequest,
  ) {
    return this.suppliersService.receivePurchaseOrder(id, orderId, dto, req.user.sub);
  }

  @Get(':id/purchase-orders')
  @ApiOperation({ summary: 'Get purchase order history for a supplier' })
  getOrders(@Param('id') id: string) {
    return this.suppliersService.getPurchaseOrders(id);
  }
}
