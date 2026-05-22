import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';

interface AuthRequest {
  user: { sub: string; schemaName: string };
}

@ApiTags('tables')
@ApiBearerAuth()
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new table' })
  create(@Body() dto: CreateTableDto, @Request() req: AuthRequest) {
    return this.tablesService.create(dto, req.user.schemaName);
  }

  @Get()
  @ApiOperation({ summary: 'List tables with active order info (shows occupied status)' })
  findAll(@Request() req: AuthRequest, @Query('branchId') branchId?: string) {
    return this.tablesService.findAll(req.user.schemaName, branchId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update table status (available|occupied|reserved)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Request() req: AuthRequest,
  ) {
    return this.tablesService.updateStatus(id, body.status, req.user.schemaName);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign an order to a table (marks table as occupied)' })
  assignOrder(
    @Param('id') id: string,
    @Body() body: { orderId: string },
    @Request() req: AuthRequest,
  ) {
    return this.tablesService.assignOrder(id, body.orderId, req.user.schemaName);
  }

  @Patch(':id/release')
  @ApiOperation({ summary: 'Release a table back to available status' })
  releaseTable(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.tablesService.releaseTable(id, req.user.schemaName);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a table (only if no active orders)' })
  delete(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.tablesService.delete(id, req.user.schemaName);
  }
}
