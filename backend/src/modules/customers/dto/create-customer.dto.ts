import { IsString, IsOptional, IsEmail, IsNumber, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEnum(['CC','NIT','CE','PP']) documentType?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() documentId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false, default: 0 }) @IsOptional() @IsNumber() @Min(0) creditLimit?: number;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsNumber() @Min(0) creditLimit?: number;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
}

export class CreditPaymentDto {
  @ApiProperty() @IsNumber() @Min(0.01) amount!: number;
  @ApiProperty() @IsEnum(['cash','card','transfer','nequi','daviplata']) paymentMethod!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() reference?: string;
}
