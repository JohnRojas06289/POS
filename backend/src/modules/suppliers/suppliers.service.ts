import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        id: uuidv4(),
        name: dto.name,
        nit: dto.nit,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      },
    });
  }

  async findAll() {
    const suppliers = await this.prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const totals = await this.prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where: {
        supplierId: { in: suppliers.map((s) => s.id) },
        status: { in: ['pending', 'partial'] },
      },
      _sum: { total: true },
    });

    return suppliers.map((s) => {
      const t = totals.find((x) => x.supplierId === s.id);
      return { ...s, totalOwed: Number(t?._sum.total ?? 0) };
    });
  }

  async createPurchaseOrder(supplierId: string, dto: CreatePurchaseOrderDto, createdBy: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    const total = dto.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

    const order = await this.prisma.purchaseOrder.create({
      data: {
        id: uuidv4(),
        supplierId,
        status: 'pending',
        total,
        notes: dto.notes,
        createdBy,
        // store items as JSON in notes until we add a PurchaseOrderItem model
        // in production, add a separate PurchaseOrderItem model
      },
    });

    return { ...order, items: dto.items };
  }

  async receivePurchaseOrder(
    supplierId: string,
    orderId: string,
    dto: ReceivePurchaseOrderDto,
    receivedBy: string,
  ) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id: orderId, supplierId },
    });
    if (!order) throw new NotFoundException(`Purchase order ${orderId} not found`);
    if (order.status === 'received') {
      throw new BadRequestException('Purchase order already received');
    }

    const branchId = 'default'; // in production, comes from user JWT

    // Receive stock for each item
    const results = [];
    for (const item of dto.items) {
      const result = await this.inventoryService.receiveStock(
        {
          variantId: item.variantId,
          branchId,
          quantity: item.quantityReceived,
          unitCost: item.actualUnitCost,
          purchaseOrderId: orderId,
        },
        receivedBy,
      );
      results.push(result);
    }

    await this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'received', receivedAt: new Date() },
    });

    return { orderId, status: 'received', receivedItems: results };
  }

  async getPurchaseOrders(supplierId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
