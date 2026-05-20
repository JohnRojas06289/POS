import { IsUUID, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty() @IsUUID() variantId!: string;
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty() @IsNumber() quantity!: number;
  @ApiProperty({ enum: ['breakage','theft','personal_use','count_correction','initial_load'] })
  @IsEnum(['breakage','theft','personal_use','count_correction','initial_load']) reasonCode!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
