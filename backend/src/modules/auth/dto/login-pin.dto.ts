import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginPinDto {
  @ApiProperty()
  @IsString()
  tenantId!: string;

  @ApiProperty()
  @IsString()
  branchId!: string;

  @ApiProperty({ minLength: 4, maxLength: 8 })
  @IsString()
  @Length(4, 8)
  pin!: string;
}
