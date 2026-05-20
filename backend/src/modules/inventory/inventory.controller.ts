import {
  Controller, Get, Post, Param, Body, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { ReceiveStockDto } from './dto/receive-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';

interface AuthRequest {
  user: { sub: string };
}

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('products')
  @ApiOperation({ summary: 'Create a product with variants' })
  createProduct(@Body() dto: CreateProductDto, @Request() req: AuthRequest) {
    return this.inventoryService.createProduct(dto, req.user.sub);
  }

  @Get('products')
  @ApiOperation({ summary: 'List products with optional filters' })
  listProducts(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('hasStock') hasStock?: string,
  ) {
    return this.inventoryService.listProducts({
      search,
      categoryId,
      hasStock: hasStock === 'true' ? true : hasStock === 'false' ? false : undefined,
    });
  }

  @Post('stock/receive')
  @ApiOperation({ summary: 'Receive stock — recalculates CPP (weighted average cost)' })
  receiveStock(@Body() dto: ReceiveStockDto, @Request() req: AuthRequest) {
    return this.inventoryService.receiveStock(dto, req.user.sub);
  }

  @Post('stock/adjust')
  @ApiOperation({ summary: 'Manual stock adjustment with mandatory reason_code' })
  adjustStock(@Body() dto: AdjustStockDto, @Request() req: AuthRequest) {
    return this.inventoryService.adjustStock(dto, req.user.sub);
  }

  @Get('stock/:variantId/kardex')
  @ApiOperation({ summary: 'Full immutable movement history for a variant' })
  getKardex(
    @Param('variantId') variantId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getKardex(variantId, cursor, limit ? parseInt(limit, 10) : 20);
  }

  @Get('stock/low')
  @ApiOperation({ summary: 'Products below min_stock, sorted by criticality' })
  getLowStock() {
    return this.inventoryService.getLowStock();
  }

  @Post('stock/transfer')
  @ApiOperation({ summary: 'Transfer stock between branches (two immutable movements)' })
  transferStock(@Body() dto: TransferStockDto, @Request() req: AuthRequest) {
    return this.inventoryService.transferStock(dto, req.user.sub);
  }
}
