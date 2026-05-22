import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
