import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createHmac } from 'crypto';

interface DevModeBody {
  from: string;
  message: string;
}

interface MetaWebhookBody {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? 'nexus_webhook_secret_dev';
  private readonly appSecret = process.env.WHATSAPP_APP_SECRET ?? '';

  constructor(
    @InjectQueue('whatsapp-messages') private readonly whatsappQueue: Queue,
  ) {}

  verifyWebhook(query: Record<string, string>): string {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }

    throw new ForbiddenException('Invalid verify token');
  }

  validateMetaSignature(body: string, signature?: string): void {
    if (!this.appSecret || !signature) {
      throw new ForbiddenException('Missing signature');
    }

    const expected = `sha256=${createHmac('sha256', this.appSecret)
      .update(body)
      .digest('hex')}`;

    if (expected !== signature) {
      throw new ForbiddenException('Invalid signature');
    }
  }

  extractMessage(
    body: MetaWebhookBody | DevModeBody,
    isDev: boolean,
  ): { from: string; message: string } | null {
    if (isDev) {
      const devBody = body as DevModeBody;
      if (devBody.from && devBody.message) {
        return { from: devBody.from, message: devBody.message };
      }
      return null;
    }

    const metaBody = body as MetaWebhookBody;
    try {
      const message = metaBody.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!message) return null;
      return {
        from: message.from,
        message: message.text?.body ?? '',
      };
    } catch {
      return null;
    }
  }

  async queueMessage(from: string, message: string): Promise<void> {
    await this.whatsappQueue.add('process', { from, message }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}
