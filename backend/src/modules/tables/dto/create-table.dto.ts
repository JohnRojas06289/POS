import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTableDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsInt()
  @Min(1)
  number: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
