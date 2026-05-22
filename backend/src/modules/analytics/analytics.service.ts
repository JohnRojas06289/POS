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

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesSummary(params: { from?: string; to?: string; branchId?: string }) {
    const fromDate = params.from ? new Date(params.from) : new Date(Date.now() - 7 * 86400000);
    const toDate = params.to ? new Date(params.to) : new Date();

    // Guard against invalid dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return this.emptySalesSummary();
    }

    const where: Prisma.OrderWhereInput = {
      status: 'completed',
      createdAt: { gte: fromDate, lte: toDate },
    };
    if (params.branchId) where.branchId = params.branchId;

    const orders = await this.prisma.order.findMany({
      where,
      include: { payments: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by day — formatted for the dashboard chart
    const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const byDayMap = new Map<string, { ventas: number; ordenes: number; day: string }>();
    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0];
      const dayName = DAY_NAMES[order.createdAt.getDay()];
      const existing = byDayMap.get(date) ?? { ventas: 0, ordenes: 0, day: dayName };
      existing.ventas += Number(order.total);
      existing.ordenes++;
      byDayMap.set(date, existing);
    }
    const salesByDay = Array.from(byDayMap.values());

    // Revenue by payment method
    const byMethodMap = new Map<string, number>();
    for (const order of orders) {
      for (const payment of order.payments) {
        const amount = Number(payment.amount);
        if (amount > 0) {
          byMethodMap.set(payment.method, (byMethodMap.get(payment.method) ?? 0) + amount);
        }
      }
    }
    const revenueByPaymentMethod = Array.from(byMethodMap.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
    }));

    const byBranchMap = new Map<string, number>();
    for (const order of orders) {
      byBranchMap.set(
        order.branchId,
        (byBranchMap.get(order.branchId) ?? 0) + Number(order.total),
      );
    }
    const revenueByBranch = Array.from(byBranchMap.entries()).map(([branchId, revenue]) => ({
      branchId,
      revenue,
    }));

    // Recent orders (last 10)
    const recentOrders = orders.slice(-10).reverse().map((o) => ({
      id: o.id,
      customer: o.customerId ?? 'Cliente',
      items: 0,
      total: Number(o.total),
      status: o.status,
      time: o.createdAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    }));

    return {
      totalRevenue: Math.round(totalRevenue),
      totalSales: Math.round(totalRevenue),
      totalOrders,
      totalCustomers: 0,
      totalProducts: 0,
      salesDelta: 0,
      ordersDelta: 0,
      customersDelta: 0,
      productsDelta: 0,
      avgTicket: Math.round(avgTicket),
      revenueByDay: salesByDay,
      revenueByBranch,
      salesByDay,
      recentOrders,
      revenueByPaymentMethod,
    };
  }

  private emptySalesSummary() {
    return {
      totalRevenue: 0,
      totalSales: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      salesDelta: 0,
      ordersDelta: 0,
      customersDelta: 0,
      productsDelta: 0,
      avgTicket: 0,
      revenueByDay: [],
      revenueByBranch: [],
      salesByDay: [],
      recentOrders: [],
      revenueByPaymentMethod: [],
    };
  }

  async getProductPerformance() {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { order: { status: 'completed' } },
      include: {
        order: { select: { createdAt: true, status: true } },
      },
    });

    // Revenue by variant
    const variantRevenue = new Map<string, { revenue: number; quantity: number; lastSale: Date }>();
    for (const item of orderItems) {
      const existing = variantRevenue.get(item.variantId) ?? {
        revenue: 0,
        quantity: 0,
        lastSale: item.order.createdAt,
      };
      existing.revenue += Number(item.total);
      existing.quantity += item.quantity;
      if (item.order.createdAt > existing.lastSale) existing.lastSale = item.order.createdAt;
      variantRevenue.set(item.variantId, existing);
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: { select: { name: true } } },
      take: 100,
    });

    const enriched = variants.map((v) => {
      const stats = variantRevenue.get(v.id);
      const daysSinceLastSale = stats
        ? Math.floor((Date.now() - stats.lastSale.getTime()) / 86400000)
        : 9999;
      return {
        variantId: v.id,
        productId: v.productId,
        name: `${v.product.name} — ${v.name}`,
        revenue: stats?.revenue ?? 0,
        quantity: stats?.quantity ?? 0,
        currentStock: v.stock,
        daysSinceLastSale,
      };
    });

    const topByRevenue = [...enriched]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const bottomByRotation = [...enriched]
      .filter((v) => v.currentStock > 0)
      .sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale)
      .slice(0, 10);

    return { topByRevenue, bottomByRotation };
  }

  async getInventoryValuation() {
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      include: { product: { select: { name: true, categoryId: true } } },
    });

    let totalCost = 0;
    let totalRetailValue = 0;

    const byCategoryMap = new Map<
      string,
      { cost: number; retailValue: number; name: string }
    >();

    for (const v of variants) {
      const cost = Number(v.unitCost) * v.stock;
      const retail = Number(v.unitPrice) * v.stock;
      totalCost += cost;
      totalRetailValue += retail;

      const catKey = v.product.categoryId ?? 'sin_categoria';
      const cat = byCategoryMap.get(catKey) ?? { cost: 0, retailValue: 0, name: catKey };
      cat.cost += cost;
      cat.retailValue += retail;
      byCategoryMap.set(catKey, cat);
    }

    const estimatedMargin =
      totalRetailValue > 0
        ? Math.round(((totalRetailValue - totalCost) / totalRetailValue) * 100)
        : 0;

    const byCategory = Array.from(byCategoryMap.entries()).map(([category, v]) => ({
      category,
      cost: Math.round(v.cost),
      retailValue: Math.round(v.retailValue),
      margin:
        v.retailValue > 0
          ? Math.round(((v.retailValue - v.cost) / v.retailValue) * 100)
          : 0,
    }));

    return {
      totalCost: Math.round(totalCost),
      totalRetailValue: Math.round(totalRetailValue),
      estimatedMargin,
      byCategory,
    };
  }

  async getExpensesSummary(schemaName: string, dateFrom?: string, dateTo?: string, branchId?: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = dateTo ? new Date(dateTo) : new Date();

        const byCategory = await tx.$queryRaw<Array<{ category: string; total: string; count: string; paid: string; pending: string }>>`
          SELECT
            category,
            SUM(amount)::text AS total,
            COUNT(*)::text AS count,
            SUM(CASE WHEN "isPaid" = true THEN amount ELSE 0 END)::text AS paid,
            SUM(CASE WHEN "isPaid" = false THEN amount ELSE 0 END)::text AS pending
          FROM "Expense"
          WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
          ${branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty}
          GROUP BY category
          ORDER BY total DESC
        `;

        const totalRow = await tx.$queryRaw<Array<{ total: string; paid: string; pending: string }>>`
          SELECT
            COALESCE(SUM(amount), 0)::text AS total,
            COALESCE(SUM(CASE WHEN "isPaid" = true THEN amount ELSE 0 END), 0)::text AS paid,
            COALESCE(SUM(CASE WHEN "isPaid" = false THEN amount ELSE 0 END), 0)::text AS pending
          FROM "Expense"
          WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
          ${branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty}
        `;

        return {
          total: parseFloat(totalRow[0]?.total ?? '0'),
          paid: parseFloat(totalRow[0]?.paid ?? '0'),
          pending: parseFloat(totalRow[0]?.pending ?? '0'),
          byCategory: byCategory.map((r) => ({
            category: r.category,
            total: parseFloat(r.total),
            count: parseInt(r.count, 10),
            paid: parseFloat(r.paid),
            pending: parseFloat(r.pending),
          })),
        };
      });
    });
  }

  async getEmployeePerformance(schemaName: string, dateFrom?: string, dateTo?: string, branchId?: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const from = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const to = dateTo ? new Date(dateTo) : new Date();

        const result = await tx.$queryRaw<Array<{
          cashier_id: string;
          total_sales: string;
          total_orders: string;
          avg_ticket: string;
        }>>`
          SELECT
            "cashierId" AS cashier_id,
            SUM(total)::text AS total_sales,
            COUNT(*)::text AS total_orders,
            AVG(total)::text AS avg_ticket
          FROM "Order"
          WHERE status = 'completed'
            AND "createdAt" >= ${from}
            AND "createdAt" <= ${to}
            ${branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty}
          GROUP BY "cashierId"
          ORDER BY total_sales DESC
        `;

        return result.map((r) => ({
          cashierId: r.cashier_id,
          totalSales: parseFloat(r.total_sales),
          totalOrders: parseInt(r.total_orders, 10),
          avgTicket: parseFloat(r.avg_ticket),
        }));
      });
    });
  }

  async getCustomerInsights() {
    const [totalCustomers, customersWithDebt, topCustomers] = await Promise.all([
      this.prisma.customer.count({ where: { isActive: true } }),
      this.prisma.customer.count({ where: { creditBalance: { gt: 0 } } }),
      this.prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { creditBalance: 'desc' },
        take: 10,
      }),
    ]);

    const totalDebt = await this.prisma.customer.aggregate({
      where: { isActive: true, creditBalance: { gt: 0 } },
      _sum: { creditBalance: true },
    });

    // Purchase stats
    const purchaseStats = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { status: 'completed', customerId: { not: null } },
      _count: { id: true },
      _sum: { total: true },
    });

    const statsMap = new Map(
      purchaseStats.map((s) => [
        s.customerId,
        { count: s._count.id, total: Number(s._sum.total ?? 0) },
      ]),
    );

    const topWithStats = topCustomers.map((c) => ({
      customerId: c.id,
      name: c.name,
      totalPurchases: statsMap.get(c.id)?.total ?? 0,
      purchaseCount: statsMap.get(c.id)?.count ?? 0,
      creditBalance: Number(c.creditBalance),
    }));

    const avgPurchaseFrequency =
      totalCustomers > 0
        ? Math.round(
            purchaseStats.reduce((s, p) => s + p._count.id, 0) / totalCustomers,
          )
        : 0;

    return {
      totalCustomers,
      customersWithDebt,
      totalDebtAmount: Number(totalDebt._sum.creditBalance ?? 0),
      topCustomers: topWithStats,
      avgPurchaseFrequency,
    };
  }
}
