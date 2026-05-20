import { IsUUID, IsNumber, Min, IsArray, ValidateNested, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RefundItemDto {
  @ApiProperty() @IsUUID() orderItemId!: string;
  @ApiProperty() @IsNumber() @Min(1) quantity!: number;
}

export class RefundOrderDto {
  @ApiProperty({ type: [RefundItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => RefundItemDto) items!: RefundItemDto[];
  @ApiProperty() @IsEnum(['cash','card','nequi','daviplata','credit_store']) refundMethod!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() reason?: string;
}
