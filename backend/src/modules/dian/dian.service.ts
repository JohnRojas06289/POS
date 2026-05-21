import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { XmlGeneratorService } from './xml-generator.service';
import { v4 as uuidv4 } from 'uuid';

const IS_DEV = process.env.NODE_ENV !== 'production';

@Injectable()
export class DianService {
  private readonly logger = new Logger(DianService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xmlGenerator: XmlGeneratorService,
  ) {}

  async generateInvoice(orderId: string, tenantId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    // Get tenant DIAN config from tenant_config
    const dianConfig = await this.prisma.tenantConfig.findUnique({
      where: { key: 'dian_config' },
    });

    const config = (dianConfig?.value as {
      nit?: string;
      softwareKey?: string;
      invoicePrefix?: string;
      currentInvoiceNumber?: number;
    } | null) ?? {};

    const invoiceNumber = `${config.invoicePrefix ?? 'SETP'}${String((config.currentInvoiceNumber ?? 1)).padStart(8, '0')}`;
    const now = new Date();
    const issueDate = now.toISOString().split('T')[0];
    const issueTime = now.toTimeString().split(' ')[0] + '-05:00';

    const invoiceData = {
      invoiceNumber,
      issueDate,
      issueTime,
      supplier: {
        nit: config.nit ?? tenant.email.replace('@', '').slice(0, 9),
        name: tenant.name,
        address: 'Colombia',
        city: 'Bogotá',
        country: 'CO',
      },
      customer: null,
      lines: (order.items ?? []).map((item, i) => ({
        id: i + 1,
        quantity: item.quantity,
        description: `Producto ${item.variantId.slice(0, 8)}`,
        unitPrice: Number(item.unitPrice),
        lineExtensionAmount: Number(item.unitPrice) * item.quantity - Number(item.discount),
        taxRate: Number(item.taxRate),
        taxAmount: (Number(item.unitPrice) * item.quantity - Number(item.discount)) * Number(item.taxRate),
      })),
      subtotal: Number(order.subtotal),
      taxTotal: Number(order.taxTotal),
      total: Number(order.total),
      softwareKey: config.softwareKey ?? 'TEST_SOFTWARE_KEY_12345678901234',
    };

    const xml = this.xmlGenerator.generateInvoiceXml(invoiceData);
    const cufe = this.xmlGenerator.calculateCufe(invoiceData);

    const xmlPath = `dian/${tenantId}/${now.getFullYear()}/${now.getMonth() + 1}/${invoiceNumber}.xml`;

    // Create DianDocument record
    const doc = await this.prisma.dianDocument.create({
      data: {
        id: uuidv4(),
        orderId,
        documentType: 'invoice',
        cufe,
        status: IS_DEV ? 'generated' : 'pending',
        payload: invoiceData as unknown as import('@prisma/client').Prisma.InputJsonValue,
        qrCode: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`,
      },
    });

    await this.prisma.tenantConfig.upsert({
      where: { key: 'dian_config' },
      update: {
        value: {
          ...config,
          currentInvoiceNumber: (config.currentInvoiceNumber ?? 1) + 1,
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
      create: {
        key: 'dian_config',
        value: {
          ...config,
          currentInvoiceNumber: (config.currentInvoiceNumber ?? 1) + 1,
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    if (!IS_DEV) {
      // TODO: transmit to DIAN via habilitador (Certicámara / etc)
      this.logger.log(`TODO: transmit to DIAN — CUFE ${cufe}`);
    } else {
      this.logger.log(`[DEV MODE] Invoice generated (not transmitted): ${cufe}`);
    }

    return {
      cufe,
      xmlPath,
      xml: IS_DEV ? xml : undefined, // only expose XML in dev
      status: doc.status,
      qrData: doc.qrCode,
      isDev: IS_DEV,
    };
  }

  async getInvoiceByOrder(orderId: string) {
    const doc = await this.prisma.dianDocument.findFirst({
      where: { orderId, documentType: 'invoice' },
    });
    if (!doc) throw new NotFoundException(`No DIAN document for order ${orderId}`);
    return doc;
  }

  async generateCreditNote(originalOrderId: string, refundOrderId: string, reason?: string) {
    const originalDoc = await this.prisma.dianDocument.findFirst({
      where: { orderId: originalOrderId, documentType: 'invoice' },
    });
    if (!originalDoc) throw new NotFoundException(`No invoice found for original order ${originalOrderId}`);

    const now = new Date();
    const creditNoteNumber = `NC${now.getTime().toString(36).toUpperCase()}`;

    const doc = await this.prisma.dianDocument.create({
      data: {
        id: uuidv4(),
        orderId: refundOrderId,
        documentType: 'credit_note',
        cufe: `CN-${originalDoc.cufe?.slice(0, 20)}`,
        status: IS_DEV ? 'generated' : 'pending',
        payload: {
          creditNoteNumber,
          originalCufe: originalDoc.cufe,
          reason,
          issueDate: now.toISOString().split('T')[0],
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    return {
      creditNoteNumber,
      originalCufe: originalDoc.cufe,
      status: doc.status,
      isDev: IS_DEV,
    };
  }

  async generateDebitNote(originalOrderId: string, debitOrderId: string, reason?: string) {
    const originalDoc = await this.prisma.dianDocument.findFirst({
      where: { orderId: originalOrderId, documentType: 'invoice' },
    });
    if (!originalDoc) throw new NotFoundException(`No invoice found for original order ${originalOrderId}`);

    const now = new Date();
    const debitNoteNumber = `ND${now.getTime().toString(36).toUpperCase()}`;

    const doc = await this.prisma.dianDocument.create({
      data: {
        id: uuidv4(),
        orderId: debitOrderId,
        documentType: 'debit_note',
        cufe: `DN-${originalDoc.cufe?.slice(0, 20)}`,
        status: IS_DEV ? 'generated' : 'pending',
        payload: {
          debitNoteNumber,
          originalCufe: originalDoc.cufe,
          reason,
          issueDate: now.toISOString().split('T')[0],
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    return {
      debitNoteNumber,
      originalCufe: originalDoc.cufe,
      status: doc.status,
      isDev: IS_DEV,
    };
  }

  async getTaxSummary(from: string, to: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: new Date(from), lte: new Date(to) },
      },
      include: { items: true },
    });

    const summary = {
      period: { from, to },
      totalOrders: orders.length,
      totalRevenue: 0,
      totalTax: 0,
      byRate: {
        iva19: { base: 0, tax: 0, orders: 0 },
        iva5: { base: 0, tax: 0, orders: 0 },
        iva0: { base: 0, tax: 0, orders: 0 },
        ica: { base: 0, tax: 0, orders: 0 },
      },
    };

    for (const order of orders) {
      summary.totalRevenue += Number(order.total);
      summary.totalTax += Number(order.taxTotal);

      for (const item of order.items) {
        const rate = Number(item.taxRate);
        const base = Number(item.unitPrice) * item.quantity - Number(item.discount);
        const tax = base * rate;

        if (rate >= 0.19) {
          summary.byRate.iva19.base += base;
          summary.byRate.iva19.tax += tax;
          summary.byRate.iva19.orders++;
        } else if (rate >= 0.05) {
          summary.byRate.iva5.base += base;
          summary.byRate.iva5.tax += tax;
          summary.byRate.iva5.orders++;
        } else {
          summary.byRate.iva0.base += base;
        }
      }
    }

    return summary;
  }

  async getSalesBook(from: string, to: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: new Date(from), lte: new Date(to) },
      },
      include: { payments: true },
      orderBy: { createdAt: 'asc' },
    });

    const rows = orders.map((order) => ({
      date: order.createdAt.toISOString(),
      orderId: order.id,
      branchId: order.branchId,
      subtotal: Number(order.subtotal),
      taxTotal: Number(order.taxTotal),
      total: Number(order.total),
      paymentMethods: order.payments.map((payment) => payment.method).join('|'),
    }));

    const csv = [
      'date,orderId,branchId,subtotal,taxTotal,total,paymentMethods',
      ...rows.map((row) => [
        row.date,
        row.orderId,
        row.branchId,
        row.subtotal,
        row.taxTotal,
        row.total,
        row.paymentMethods,
      ].join(',')),
    ].join('\n');

    return {
      period: { from, to },
      rows,
      csv,
    };
  }
}
