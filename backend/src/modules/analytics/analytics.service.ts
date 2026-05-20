import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesSummary(params: { from: string; to: string; branchId?: string }) {
    const where: Prisma.OrderWhereInput = {
      status: 'completed',
      createdAt: { gte: new Date(params.from), lte: new Date(params.to) },
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

    // Revenue by day
    const byDayMap = new Map<string, { revenue: number; orders: number }>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().split('T')[0];
      const existing = byDayMap.get(day) ?? { revenue: 0, orders: 0 };
      existing.revenue += Number(order.total);
      existing.orders++;
      byDayMap.set(day, existing);
    }
    const revenueByDay = Array.from(byDayMap.entries()).map(([date, v]) => ({ date, ...v }));

    // Revenue by branch
    const byBranchMap = new Map<string, number>();
    for (const order of orders) {
      byBranchMap.set(order.branchId, (byBranchMap.get(order.branchId) ?? 0) + Number(order.total));
    }
    const revenueByBranch = Array.from(byBranchMap.entries()).map(([branchId, revenue]) => ({
      branchId,
      revenue,
    }));

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

    return {
      totalRevenue,
      totalOrders,
      avgTicket: Math.round(avgTicket),
      revenueByDay,
      revenueByBranch,
      revenueByPaymentMethod,
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
