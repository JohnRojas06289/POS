import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({ description: 'Tenant email used to locate the business account' })
  @IsEmail()
  tenantEmail!: string;

  @ApiProperty({ description: 'User email that will receive the reset link' })
  @IsEmail()
  email!: string;
}
