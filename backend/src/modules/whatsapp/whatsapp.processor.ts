import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma/prisma.service';
import { LlmService } from './llm.service';
import { CfoIntentsService } from './cfo-intents.service';

interface WhatsappJob {
  from: string;
  message: string;
}

@Injectable()
@Processor('whatsapp-messages')
export class WhatsappProcessor {
  private readonly logger = new Logger(WhatsappProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly cfoIntentsService: CfoIntentsService,
  ) {}

  @Process('process')
  async handleMessage(job: Job<WhatsappJob>): Promise<void> {
    const { from, message } = job.data;
    this.logger.log(`Processing message from ${from}: "${message}"`);

    try {
      // 1. Find tenant by WhatsApp phone number
      const tenant = await this.findTenantByPhone(from);
      if (!tenant) {
        await this.sendMessage(
          from,
          '👋 No encontré una cuenta Nexus asociada a este número. Regístrate en nexus.app',
        );
        return;
      }

      // 2. Classify intent
      const intent = await this.llmService.classifyIntent(message);
      this.logger.log(`Intent: ${intent} for tenant ${tenant.id}`);

      // 3. Fetch business data for intent
      const data = await this.cfoIntentsService.getDataForIntent(intent, tenant.schemaName);

      // 4. Generate natural response
      const response = await this.llmService.generateResponse(
        message,
        intent,
        data,
        tenant.name,
      );

      // 5. Send via WhatsApp API
      await this.sendMessage(from, response);
    } catch (error) {
      this.logger.error(`Failed to process message from ${from}`, error);
    }
  }

  private async findTenantByPhone(phone: string) {
    // Normalize phone: strip +, spaces, dashes
    const normalized = phone.replace(/\D/g, '');
    return this.prisma.tenant.findFirst({
      where: {
        phone: { contains: normalized.slice(-10) },
        isActive: true,
      },
    });
  }

  private async sendMessage(to: string, text: string): Promise<void> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      this.logger.warn(`[DEV] Would send to ${to}: ${text.slice(0, 80)}...`);
      return;
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`WhatsApp API error ${response.status}: ${body}`);
    }
  }
}
