import { IsUUID, IsNumber, Min, IsOptional, IsString, IsDateString, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveStockDto {
  @ApiProperty() @IsUUID() variantId!: string;
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty() @IsNumber() @IsPositive() quantity!: number;
  @ApiProperty() @IsNumber() @IsPositive() unitCost!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() expiresAt?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() batchNumber?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() purchaseOrderId?: string;
}
