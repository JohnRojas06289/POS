import {
  Controller, Get, Post, Patch, Param, Body, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { ReceiveStockDto } from './dto/receive-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface AuthRequest {
  user: { sub: string; schemaName: string };
}

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('products')
  @ApiOperation({ summary: 'Create a product with variants' })
  createProduct(@Body() dto: CreateProductDto, @Request() req: AuthRequest) {
    return this.inventoryService.createProduct(dto, req.user.sub, req.user.schemaName);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update product name, description, image, price or status' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req: AuthRequest) {
    return this.inventoryService.updateProduct(id, dto, req.user.schemaName);
  }

  @Post('products/:id/variants')
  @ApiOperation({ summary: 'Add variants to an existing product' })
  addVariants(
    @Param('id') id: string,
    @Body() variants: CreateVariantDto[],
    @Request() req: AuthRequest,
  ) {
    return this.inventoryService.addVariants(id, variants, req.user.schemaName);
  }

  @Get('products')
  @ApiOperation({ summary: 'List products with optional filters' })
  listProducts(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('hasStock') hasStock?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.inventoryService.listProducts({
      search,
      categoryId,
      hasStock: hasStock === 'true' ? true : hasStock === 'false' ? false : undefined,
    }, req!.user.schemaName);
  }

  @Post('stock/receive')
  @ApiOperation({ summary: 'Receive stock — recalculates CPP (weighted average cost)' })
  receiveStock(@Body() dto: ReceiveStockDto, @Request() req: AuthRequest) {
    return this.inventoryService.receiveStock(dto, req.user.sub, req.user.schemaName);
  }

  @Post('stock/adjust')
  @ApiOperation({ summary: 'Manual stock adjustment with mandatory reason_code' })
  adjustStock(@Body() dto: AdjustStockDto, @Request() req: AuthRequest) {
    return this.inventoryService.adjustStock(dto, req.user.sub, req.user.schemaName);
  }

  @Get('stock/:variantId/kardex')
  @ApiOperation({ summary: 'Full immutable movement history for a variant' })
  getKardex(
    @Param('variantId') variantId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Request() req?: AuthRequest,
  ) {
    return this.inventoryService.getKardex(variantId, req!.user.schemaName, cursor, limit ? parseInt(limit, 10) : 20);
  }

  @Get('stock/low')
  @ApiOperation({ summary: 'Products below min_stock, sorted by criticality' })
  getLowStock(@Request() req: AuthRequest) {
    return this.inventoryService.getLowStock(req.user.schemaName);
  }

  @Post('stock/transfer')
  @ApiOperation({ summary: 'Transfer stock between branches (two immutable movements)' })
  transferStock(@Body() dto: TransferStockDto, @Request() req: AuthRequest) {
    return this.inventoryService.transferStock(dto, req.user.sub, req.user.schemaName);
  }
}
