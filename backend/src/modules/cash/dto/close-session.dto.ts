import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloseCashSessionDto {
  @ApiProperty() @IsNumber() @Min(0) closingCash!: number;
}
