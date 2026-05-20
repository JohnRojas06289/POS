import {
  IsString, IsOptional, IsNumber, Min, Max, IsBoolean, IsUrl, IsArray, IsUUID, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty() @IsString() sku!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() barcode?: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false }) @IsOptional() attributes?: Record<string, string>;
  @ApiProperty() @IsNumber() @Min(0) unitPrice!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) minStock?: number;
}

export class CreateProductDto {
  @ApiProperty() @IsString() sku!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() barcode?: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() categoryId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUrl() imageUrl?: string;
  @ApiProperty() @IsNumber() @Min(0) unitPrice!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) @Max(1) taxRate?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isPerishable?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() hasVariants?: boolean;
  @ApiProperty({ type: [CreateVariantDto], required: false })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
