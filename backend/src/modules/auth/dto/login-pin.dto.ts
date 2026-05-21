import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginPinDto {
  @ApiProperty()
  @IsString()
  tenantId!: string;

  @ApiProperty()
  @IsString()
  branchId!: string;

  @ApiProperty({ minLength: 4, maxLength: 4 })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  pin!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  terminalId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  terminalName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}
