import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

interface AuthRequest {
  user: { sub: string; schemaName: string; branchId?: string };
}

@ApiTags('quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote with line items' })
  create(@Body() dto: CreateQuoteDto, @Request() req: AuthRequest) {
    return this.quotesService.create(
      { ...dto, branchId: dto.branchId ?? req.user.branchId },
      req.user.sub,
      req.user.schemaName,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List quotes with optional branch and status filters' })
  findAll(
    @Request() req: AuthRequest,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    return this.quotesService.findAll(req.user.schemaName, branchId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single quote with items and customer' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.quotesService.findOne(id, req.user.schemaName);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update quote status (draft|sent|accepted|rejected|expired)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req: AuthRequest,
  ) {
    return this.quotesService.updateStatus(id, body.status, req.user.schemaName);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Mark quote as accepted (convert to order via POS)' })
  convertToOrder(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.quotesService.convertToOrder(id, req.user.schemaName);
  }
}
