import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

interface AuthRequest {
  user: { sub: string; branchId?: string | null };
}

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a categorized petty expense (gasto hormiga)' })
  create(@Body() dto: CreateExpenseDto, @Request() req: AuthRequest) {
    return this.expensesService.create(dto, req.user.sub, req.user.branchId);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses with optional filters' })
  findAll(
    @Query('category') category?: string,
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.expensesService.findAll({ category, branchId, from, to });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Monthly expense audit summary by category' })
  summary(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.expensesService.getSummary({ branchId, from, to });
  }
}
