import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CreditPaymentDto } from './dto/create-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customers with optional filters' })
  findAll(
    @Query('search') search?: string,
    @Query('hasDebt') hasDebt?: string,
  ) {
    return this.customersService.findAll({
      search,
      hasDebt: hasDebt === 'true' ? true : hasDebt === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer detail with credit history' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer data' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/credit/payment')
  @ApiOperation({ summary: 'Customer pays their credit balance' })
  payCredit(@Param('id') id: string, @Body() dto: CreditPaymentDto) {
    return this.customersService.payCredit(id, dto);
  }

  @Get(':id/credit/statement')
  @ApiOperation({ summary: 'Get customer credit statement' })
  statement(@Param('id') id: string) {
    return this.customersService.getCreditStatement(id);
  }
}
