import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  ForbiddenException,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('whatsapp')
@Public()
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('webhook')
  @ApiOperation({ summary: 'Meta webhook verification' })
  verifyWebhook(@Query() query: Record<string, string>): string {
    return this.whatsappService.verifyWebhook(query);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receive WhatsApp messages' })
  async receiveMessage(
    @Body() body: unknown,
    @Headers() headers: Record<string, string>,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ queued: boolean }> {
    const isDev =
      headers['x-dev-mode'] === 'true' &&
      process.env.NODE_ENV !== 'production';

    if (!isDev) {
      const rawBody = req.rawBody?.toString() ?? JSON.stringify(body);
      this.whatsappService.validateMetaSignature(
        rawBody,
        headers['x-hub-signature-256'],
      );
    }

    const extracted = this.whatsappService.extractMessage(
      body as Parameters<typeof this.whatsappService.extractMessage>[0],
      isDev,
    );

    if (!extracted) {
      return { queued: false };
    }

    await this.whatsappService.queueMessage(extracted.from, extracted.message);
    this.logger.log(`Queued message from ${extracted.from}`);

    return { queued: true };
  }
}
