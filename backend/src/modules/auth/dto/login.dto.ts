import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Tenant email (same as owner email for single-tenant discovery)' })
  @IsEmail()
  tenantEmail!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
