import { Controller, Post, Get, Param, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { SyncPushDto, SyncPullDto, ResolveConflictDto } from './dto/sync-push.dto';

interface AuthRequest { user: { sub: string } }

@ApiTags('sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Push offline operations queue to server' })
  push(@Body() dto: SyncPushDto, @Request() req: AuthRequest) {
    return this.syncService.pushOperations(dto, req.user.sub);
  }

  @Post('pull')
  @ApiOperation({ summary: 'Pull server changes since last sync' })
  pull(@Body() dto: SyncPullDto) {
    return this.syncService.pullUpdates({
      lastSyncAt: dto.lastSyncAt,
      branchId: dto.branchId,
    });
  }

  @Get('queue')
  @ApiOperation({ summary: 'List pending/conflict operations in sync queue' })
  queue(
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.syncService.getQueue({ status, entityType });
  }

  @Post('queue/:id/resolve')
  @ApiOperation({ summary: 'Manually resolve a sync conflict' })
  resolve(@Param('id') id: string, @Body() dto: ResolveConflictDto) {
    return this.syncService.resolveConflict(id, dto.resolution, dto.mergedPayload);
  }
}
