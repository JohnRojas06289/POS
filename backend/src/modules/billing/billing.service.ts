import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly wompiApiUrl: string;
  private readonly wompiEventsSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.wompiApiUrl = this.config.get<string>('wompi.apiUrl') ?? 'https://sandbox.wompi.co/v1';
    this.wompiEventsSecret = this.config.get<string>('wompi.eventsSecret') ?? '';
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getSubscription(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCheckoutSession(
    tenantId: string,
    planId: string,
    customerEmail: string,
    customerName: string,
  ): Promise<{ checkoutUrl: string; reference: string }> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    const reference = `nexus-${tenantId.slice(0, 8)}-${uuidv4().slice(0, 8)}`;
    const amountInCents = Math.round(Number(plan.price) * 100);
    const publicKey = this.config.get<string>('wompi.publicKey') ?? '';
    const appUrl = this.config.get<string>('app.url') ?? 'http://localhost:3000';

    const params = new URLSearchParams({
      'public-key': publicKey,
      currency: 'COP',
      'amount-in-cents': String(amountInCents),
      reference,
      'customer-email': customerEmail,
      'redirect-url': `${appUrl}/onboarding/success?ref=${reference}`,
    });

    const checkoutUrl = `https://checkout.wompi.co/p/?${params.toString()}`;

    await this.prisma.subscription.updateMany({
      where: { tenantId },
      data: {
        wompiReference: reference,
        status: 'pending',
      },
    });

    return { checkoutUrl, reference };
  }

  async handleWebhook(body: Record<string, unknown>, signature: string): Promise<void> {
    if (!this.verifySignature(body, signature)) {
      this.logger.warn('Invalid Wompi webhook signature');
      return;
    }

    const event = body['event'] as string;
    if (event !== 'transaction.updated') return;

    const data = body['data'] as { transaction: { status: string; reference: string } };
    const { reference, status } = data.transaction;

    const subscription = await this.prisma.subscription.findFirst({
      where: { wompiReference: reference },
    });
    if (!subscription) return;

    if (status === 'APPROVED') {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      await this.prisma.tenant.update({
        where: { id: subscription.tenantId },
        data: { isActive: true },
      });
      this.logger.log(`Tenant ${subscription.tenantId} activated`);
    } else if (status === 'DECLINED' || status === 'ERROR') {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'cancelled' },
      });
    }
  }

  private verifySignature(body: Record<string, unknown>, receivedSignature: string): boolean {
    if (!this.wompiEventsSecret) return true;

    const data = body['data'] as Record<string, Record<string, unknown>>;
    const timestamp = body['timestamp'] as number;
    const sigProps = (body['signature'] as { properties: string[] })?.properties ?? [];

    const chain = sigProps
      .map((prop) => {
        const parts = prop.split('.');
        let val: unknown = data;
        for (const part of parts) val = (val as Record<string, unknown>)[part];
        return String(val ?? '');
      })
      .join('');

    const expected = createHmac('sha256', this.wompiEventsSecret)
      .update(`${chain}${timestamp}`)
      .digest('hex');

    return expected === receivedSignature;
  }
}
