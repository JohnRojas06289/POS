import { IsUUID, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferStockDto {
  @ApiProperty() @IsUUID() variantId!: string;
  @ApiProperty() @IsUUID() fromBranchId!: string;
  @ApiProperty() @IsUUID() toBranchId!: string;
  @ApiProperty() @IsNumber() @IsPositive() quantity!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
