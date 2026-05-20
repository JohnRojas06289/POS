import { IsString, IsOptional, IsEmail, IsNumber, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() nit?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() contactPerson?: string;
  @ApiProperty({ required: false, default: 30 }) @IsOptional() @IsInt() @Min(0) paymentTermsDays?: number;
}
