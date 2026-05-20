import { IsUUID, IsOptional, IsString, IsArray, ValidateNested, IsNumber, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty() @IsUUID() variantId!: string;
  @ApiProperty() @IsNumber() @Min(1) quantity!: number;
  @ApiProperty() @IsNumber() @Min(0) unitPrice!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) discount?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class PaymentDto {
  @ApiProperty() @IsEnum(['cash','card','nequi','daviplata','credit_store']) method!: string;
  @ApiProperty() @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() reference?: string;
}

export class CreateOrderDto {
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() localId?: string;
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() terminalId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() customerId?: string;
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto) items!: OrderItemDto[];
  @ApiProperty({ type: [PaymentDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PaymentDto) payments!: PaymentDto[];
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) discountTotal?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() clientTimestamp?: string;
}
