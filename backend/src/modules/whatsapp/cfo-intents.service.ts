import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

async function withSchema<T>(
  tx: Prisma.TransactionClient,
  schemaName: string,
  fn: () => Promise<T>,
): Promise<T> {
  await tx.$executeRawUnsafe(`SET LOCAL search_path = "${schemaName}", public`);
  return fn();
}

export enum CfoIntent {
  VENTAS_HOY = 'VENTAS_HOY',
  VENTAS_AYER = 'VENTAS_AYER',
  STOCK_BAJO = 'STOCK_BAJO',
  PRODUCTO_TOP = 'PRODUCTO_TOP',
  DEUDAS_CLIENTES = 'DEUDAS_CLIENTES',
  RESUMEN_SEMANA = 'RESUMEN_SEMANA',
  UNKNOWN = 'UNKNOWN',
}

@Injectable()
export class CfoIntentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDataForIntent(intent: CfoIntent, schemaName: string): Promise<unknown> {
    switch (intent) {
      case CfoIntent.VENTAS_HOY:
        return this.getVentasHoy(schemaName);
      case CfoIntent.VENTAS_AYER:
        return this.getVentasAyer(schemaName);
      case CfoIntent.STOCK_BAJO:
        return this.getStockBajo(schemaName);
      case CfoIntent.PRODUCTO_TOP:
        return this.getProductoTop(schemaName);
      case CfoIntent.DEUDAS_CLIENTES:
        return this.getDeudasClientes(schemaName);
      case CfoIntent.RESUMEN_SEMANA:
        return this.getResumenSemana(schemaName);
      default:
        return null;
    }
  }

  private async getVentasHoy(schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const result = await tx.$queryRaw<Array<{
          total: string;
          count: string;
          avg_ticket: string;
        }>>`
          SELECT
            COALESCE(SUM(total), 0)::text AS total,
            COUNT(*)::text AS count,
            COALESCE(AVG(total), 0)::text AS avg_ticket
          FROM "Order"
          WHERE DATE("createdAt") = CURRENT_DATE
            AND status = 'completed'
        `;
        const row = result[0] ?? { total: '0', count: '0', avg_ticket: '0' };
        return {
          total: parseFloat(row.total),
          count: parseInt(row.count, 10),
          avgTicket: parseFloat(row.avg_ticket),
        };
      });
    });
  }

  private async getVentasAyer(schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const result = await tx.$queryRaw<Array<{
          total: string;
          count: string;
        }>>`
          SELECT
            COALESCE(SUM(total), 0)::text AS total,
            COUNT(*)::text AS count
          FROM "Order"
          WHERE DATE("createdAt") = CURRENT_DATE - INTERVAL '1 day'
            AND status = 'completed'
        `;
        const row = result[0] ?? { total: '0', count: '0' };
        return { total: parseFloat(row.total), count: parseInt(row.count, 10) };
      });
    });
  }

  private async getStockBajo(schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const result = await tx.$queryRaw<Array<{
          name: string;
          sku: string;
          stock: string;
          min_stock: string;
        }>>`
          SELECT pv.name, pv.sku, pv.stock::text, pv."minStock"::text AS min_stock
          FROM "ProductVariant" pv
          WHERE pv."isActive" = true
            AND pv.stock <= pv."minStock"
          ORDER BY pv.stock ASC
          LIMIT 10
        `;
        return result.map((r) => ({
          name: r.name,
          sku: r.sku,
          currentStock: parseInt(r.stock, 10),
          minStock: parseInt(r.min_stock, 10),
        }));
      });
    });
  }

  private async getProductoTop(schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const result = await tx.$queryRaw<Array<{
          name: string;
          total_qty: string;
          total_revenue: string;
        }>>`
          SELECT
            pv.name,
            SUM(oi.quantity)::text AS total_qty,
            SUM(oi.total)::text AS total_revenue
          FROM "OrderItem" oi
          JOIN "ProductVariant" pv ON pv.id = oi."variantId"
          JOIN "Order" o ON o.id = oi."orderId"
          WHERE o.status = 'completed'
            AND DATE(o."createdAt") >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY pv.name
          ORDER BY total_revenue DESC
          LIMIT 5
        `;
        return result.map((r) => ({
          name: r.name,
          qty: parseInt(r.total_qty, 10),
          revenue: parseFloat(r.total_revenue),
        }));
      });
    });
  }

  private async getDeudasClientes(schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const result = await tx.$queryRaw<Array<{
          name: string;
          credit_balance: string;
        }>>`
          SELECT name, "creditBalance"::text AS credit_balance
          FROM "Customer"
          WHERE "creditBalance" > 0 AND "isActive" = true
          ORDER BY "creditBalance" DESC
          LIMIT 10
        `;
        const totalRow = await tx.$queryRaw<Array<{ total: string; count: string }>>`
          SELECT COALESCE(SUM("creditBalance"), 0)::text AS total, COUNT(*)::text AS count
          FROM "Customer"
          WHERE "creditBalance" > 0 AND "isActive" = true
        `;
        return {
          total: parseFloat(totalRow[0]?.total ?? '0'),
          count: parseInt(totalRow[0]?.count ?? '0', 10),
          topDebtors: result.map((r) => ({
            name: r.name,
            balance: parseFloat(r.credit_balance),
          })),
        };
      });
    });
  }

  private async getResumenSemana(schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const result = await tx.$queryRaw<Array<{
          day: string;
          total: string;
          count: string;
        }>>`
          SELECT
            DATE("createdAt")::text AS day,
            SUM(total)::text AS total,
            COUNT(*)::text AS count
          FROM "Order"
          WHERE status = 'completed'
            AND "createdAt" >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE("createdAt")
          ORDER BY day ASC
        `;
        return result.map((r) => ({
          day: r.day,
          total: parseFloat(r.total),
          count: parseInt(r.count, 10),
        }));
      });
    });
  }
}
