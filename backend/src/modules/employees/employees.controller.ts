import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { RecordPayrollPaymentDto } from './dto/record-payroll-payment.dto';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List employees with payroll aggregates' })
  list(
    @CurrentUser() user: CurrentUserData,
    @Query('branchId') branchId?: string,
    @Query('active') active?: string,
  ) {
    return this.employeesService.list(user.schemaName, { branchId, active });
  }

  @Post()
  @ApiOperation({ summary: 'Create employee / payroll profile' })
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user.schemaName, dto, user.branchId ?? null);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record payroll payment for an employee' })
  recordPayment(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: RecordPayrollPaymentDto,
  ) {
    return this.employeesService.recordPayment(user.schemaName, id, dto, user.sub);
  }

  @Get('payroll/summary')
  @ApiOperation({ summary: 'Get payroll summary for a period' })
  summary(
    @CurrentUser() user: CurrentUserData,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.employeesService.getPayrollSummary(user.schemaName, { from, to });
  }
}
