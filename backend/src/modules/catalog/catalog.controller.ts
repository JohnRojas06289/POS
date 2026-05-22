import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('catalog')
@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':slug/products')
  @ApiOperation({ summary: 'List active products with stock for a tenant (public)' })
  getPublicProducts(@Param('slug') slug: string) {
    return this.catalogService.getPublicProducts(slug);
  }

  @Get(':slug/info')
  @ApiOperation({ summary: 'Get public business info for a tenant (public)' })
  getBusinessInfo(@Param('slug') slug: string) {
    return this.catalogService.getBusinessInfo(slug);
  }
}
