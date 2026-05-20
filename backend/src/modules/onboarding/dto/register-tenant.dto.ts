import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(7)
  phone: string;

  @IsString()
  @Matches(/^[a-z0-9_]+$/, { message: 'schemaName must be lowercase alphanumeric with underscores' })
  @MinLength(3)
  @MaxLength(30)
  schemaName: string;

  @IsString()
  planId: string;

  @IsString()
  templateId: string;
}
