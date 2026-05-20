import { IsUUID, IsNumber, IsPositive, IsArray, ValidateNested, IsOptional, IsDateString, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseOrderItemDto {
  @ApiProperty() @IsUUID() variantId!: string;
  @ApiProperty() @IsInt() @IsPositive() quantity!: number;
  @ApiProperty() @IsNumber() @IsPositive() unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() expectedAt?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class ReceivePOItemDto {
  @ApiProperty() @IsUUID() variantId!: string;
  @ApiProperty() @IsInt() @IsPositive() quantityReceived!: number;
  @ApiProperty() @IsNumber() @IsPositive() actualUnitCost!: number;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [ReceivePOItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ReceivePOItemDto)
  items!: ReceivePOItemDto[];
}
