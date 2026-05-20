import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenCashSessionDto {
  @ApiProperty() @IsUUID() terminalId!: string;
  @ApiProperty() @IsNumber() @Min(0) openingCash!: number;
}
