import { IsUUID, IsArray, ValidateNested, IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SyncOperationDto {
  @ApiProperty() @IsUUID() localId!: string;
  @ApiProperty() @IsEnum(['order','payment','stock_movement','customer','expense']) entityType!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() entityId?: string;
  @ApiProperty() @IsEnum(['CREATE','UPDATE','DELETE']) operation!: string;
  @ApiProperty() payload!: Record<string, unknown>;
  @ApiProperty() @IsDateString() clientTimestamp!: string;
}

export class SyncPushDto {
  @ApiProperty() @IsUUID() terminalId!: string;
  @ApiProperty({ type: [SyncOperationDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SyncOperationDto)
  operations!: SyncOperationDto[];
}

export class SyncPullDto {
  @ApiProperty() @IsUUID() terminalId!: string;
  @ApiProperty() @IsDateString() lastSyncAt!: string;
  @ApiProperty() @IsUUID() branchId!: string;
}

export class ResolveConflictDto {
  @ApiProperty() @IsEnum(['keep_local','keep_server','merge']) resolution!: string;
  @ApiProperty({ required: false }) @IsOptional() mergedPayload?: Record<string, unknown>;
}
