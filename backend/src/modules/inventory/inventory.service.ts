import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ReceiveStockDto } from './dto/receive-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { CreateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { v4 as uuidv4 } from 'uuid';
import { assertValidSchemaName } from '../../common/utils/tenant-schema.util';

// Helper: set LOCAL search_path within an interactive transaction.
// SET LOCAL is automatically reverted when the transaction commits/rolls back,
// so it never contaminates the connection pool.
async function withSchema<T>(
  tx: Prisma.TransactionClient,
  schemaName: string,
  fn: () => Promise<T>,
): Promise<T> {
  await tx.$executeRawUnsafe(`SET LOCAL search_path = "${schemaName}", public`);
  return fn();
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly EXPIRY_WARN_DAYS = 3;

  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto, createdBy: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, () =>
        tx.product.create({
          data: {
            id: uuidv4(),
            sku: dto.sku,
            barcode: dto.barcode,
            name: dto.name,
            description: dto.description,
            categoryId: dto.categoryId,
            imageUrl: dto.imageUrl,
            unitCost: 0,
            unitPrice: dto.unitPrice,
            taxRate: dto.taxRate ?? 0,
            hasVariants: dto.hasVariants ?? false,
            metadata: { isPerishable: dto.isPerishable ?? false, createdBy },
            variants: {
              create: dto.hasVariants && dto.variants?.length
                ? dto.variants.map((v) => ({
                    id: uuidv4(),
                    sku: v.sku,
                    barcode: v.barcode,
                    name: v.name,
                    attributes: v.attributes ?? {},
                    unitCost: 0,
                    unitPrice: v.unitPrice,
                    stock: 0,
                    minStock: v.minStock ?? 0,
                  }))
                : [{
                    id: uuidv4(),
                    sku: dto.sku,
                    barcode: dto.barcode,
                    name: dto.name,
                    attributes: {},
                    unitCost: 0,
                    unitPrice: dto.unitPrice,
                    stock: 0,
                    minStock: 0,
                  }],
            },
          },
          include: { variants: true },
        }),
      );
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto, schemaName: string) {
    assertValidSchemaName(schemaName);
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const product = await tx.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException(`Product ${id} not found`);

        return tx.product.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
            ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          },
          include: { variants: true },
        });
      });
    });
  }

  async addVariants(productId: string, variants: CreateVariantDto[], schemaName: string) {
    assertValidSchemaName(schemaName);
    if (!variants.length) throw new BadRequestException('At least one variant is required');

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new NotFoundException(`Product ${productId} not found`);

        await tx.productVariant.createMany({
          data: variants.map((variant) => ({
            id: uuidv4(),
            productId,
            sku: variant.sku,
            barcode: variant.barcode,
            name: variant.name,
            attributes: variant.attributes ?? {},
            unitCost: 0,
            unitPrice: variant.unitPrice,
            stock: 0,
            minStock: variant.minStock ?? 0,
          })),
        });

        return tx.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });
      });
    });
  }

  async listProducts(filters: {
    search?: string;
    categoryId?: string;
    hasStock?: boolean;
  }, schemaName: string) {
    assertValidSchemaName(schemaName);

    const products = await this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, () => {
        const where: Prisma.ProductWhereInput = { isActive: true };
        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
            { barcode: { contains: filters.search, mode: 'insensitive' } },
          ];
        }
        if (filters.categoryId) where.categoryId = filters.categoryId;

        return tx.product.findMany({
          where,
          include: { variants: true },
          orderBy: { name: 'asc' },
        });
      });
    });

    if (filters.hasStock === true) {
      return products.filter((p) => p.variants.some((v) => Number(v.stock) > 0));
    }
    if (filters.hasStock === false) {
      return products.filter((p) => p.variants.every((v) => Number(v.stock) === 0));
    }
    return products;
  }

  async receiveStock(dto: ReceiveStockDto, receivedBy: string, schemaName: string) {
    assertValidSchemaName(schemaName);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const variant = await tx.productVariant.findUnique({ where: { id: dto.variantId } });
        if (!variant) throw new NotFoundException(`Variant ${dto.variantId} not found`);

        const currentStock = variant.stock;
        const currentCPP = Number(variant.unitCost);
        const newQty = dto.quantity;
        const newCost = dto.unitCost;
        const totalStock = currentStock + newQty;
        const newCPP = totalStock > 0
          ? (currentStock * currentCPP + newQty * newCost) / totalStock
          : newCost;

        const updatedVariant = await tx.productVariant.update({
          where: { id: dto.variantId },
          data: { stock: totalStock, unitCost: newCPP },
        });

        const entryId = uuidv4();
        const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
        const warnDate = expiresAt
          ? new Date(expiresAt.getTime() - this.EXPIRY_WARN_DAYS * 86400000)
          : null;
        const isExpiringSoon = warnDate ? new Date() >= warnDate : false;

        await tx.stockEntry.create({
          data: {
            id: entryId,
            variantId: dto.variantId,
            quantity: dto.quantity,
            unitCost: dto.unitCost,
            supplierId: null,
            expiresAt,
            notes: [
              dto.batchNumber ? `Lote: ${dto.batchNumber}` : null,
              dto.invoiceNumber ? `Factura: ${dto.invoiceNumber}` : null,
              isExpiringSoon ? 'EXPIRING_SOON' : null,
            ].filter(Boolean).join(' | ') || null,
          },
        });

        await tx.stockMovement.create({
          data: {
            id: uuidv4(),
            variantId: dto.variantId,
            type: 'purchase',
            quantity: dto.quantity,
            previousQty: currentStock,
            newQty: totalStock,
            reason: dto.purchaseOrderId ? `PO:${dto.purchaseOrderId}` : 'stock_receive',
            referenceId: dto.purchaseOrderId ?? entryId,
            referenceType: dto.purchaseOrderId ? 'purchase_order' : 'stock_entry',
            createdBy: receivedBy,
          },
        });

        return {
          variant: updatedVariant,
          previousStock: currentStock,
          newStock: totalStock,
          previousCPP: currentCPP,
          newCPP: parseFloat(newCPP.toFixed(4)),
          stockEntry: entryId,
        };
      });
    });
  }

  async adjustStock(dto: AdjustStockDto, adjustedBy: string, schemaName: string) {
    assertValidSchemaName(schemaName);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const variant = await tx.productVariant.findUnique({ where: { id: dto.variantId } });
        if (!variant) throw new NotFoundException(`Variant ${dto.variantId} not found`);

        const currentStock = variant.stock;
        const newStock = currentStock + dto.quantity;

        if (newStock < 0) {
          throw new BadRequestException(
            `Adjustment would result in negative stock (current: ${currentStock}, delta: ${dto.quantity})`,
          );
        }

        const updated = await tx.productVariant.update({
          where: { id: dto.variantId },
          data: { stock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            id: uuidv4(),
            variantId: dto.variantId,
            type: 'adjustment',
            quantity: dto.quantity,
            previousQty: currentStock,
            newQty: newStock,
            reason: dto.reasonCode,
            referenceType: 'adjustment',
            createdBy: adjustedBy,
          },
        });

        return { variant: updated, previousStock: currentStock, newStock };
      });
    });
  }

  async getKardex(variantId: string, schemaName: string, cursor?: string, limit = 20) {
    assertValidSchemaName(schemaName);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
        if (!variant) throw new NotFoundException(`Variant ${variantId} not found`);

        const where: Prisma.StockMovementWhereInput = { variantId };
        if (cursor) where.id = { gt: cursor };

        const movements = await tx.stockMovement.findMany({
          where,
          take: limit + 1,
          orderBy: { createdAt: 'desc' },
        });

        const hasMore = movements.length > limit;
        const data = hasMore ? movements.slice(0, limit) : movements;

        return {
          variant: { id: variant.id, sku: variant.sku, currentStock: variant.stock },
          data,
          nextCursor: hasMore ? data[data.length - 1].id : null,
          hasMore,
        };
      });
    });
  }

  async getLowStock(schemaName: string) {
    assertValidSchemaName(schemaName);

    const variants = await this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, () =>
        tx.productVariant.findMany({
          where: { isActive: true },
          include: { product: { select: { name: true, sku: true } } },
          orderBy: { stock: 'asc' },
        }),
      );
    });

    return variants
      .filter((v) => v.stock <= v.minStock)
      .map((v) => ({
        ...v,
        stockPercent: v.minStock > 0
          ? Math.round((v.stock / v.minStock) * 100)
          : v.stock === 0 ? 0 : 100,
      }))
      .sort((a, b) => a.stockPercent - b.stockPercent);
  }

  async transferStock(dto: TransferStockDto, transferredBy: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException('Source and destination branches must be different');
    }

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const variant = await tx.productVariant.findUnique({ where: { id: dto.variantId } });
        if (!variant) throw new NotFoundException(`Variant ${dto.variantId} not found`);
        if (variant.stock < dto.quantity) {
          throw new BadRequestException(
            `Insufficient stock: available ${variant.stock}, requested ${dto.quantity}`,
          );
        }

        const transferId = uuidv4();
        const prevQty = variant.stock;
        const newQty = prevQty - dto.quantity;

        await tx.productVariant.update({ where: { id: dto.variantId }, data: { stock: newQty } });

        await tx.stockMovement.create({
          data: {
            id: uuidv4(),
            variantId: dto.variantId,
            type: 'transfer_out',
            quantity: -dto.quantity,
            previousQty: prevQty,
            newQty,
            reason: dto.notes ?? `Transfer to ${dto.toBranchId}`,
            referenceId: transferId,
            referenceType: 'transfer',
            createdBy: transferredBy,
          },
        });

        await tx.stockMovement.create({
          data: {
            id: uuidv4(),
            variantId: dto.variantId,
            type: 'transfer_in',
            quantity: dto.quantity,
            previousQty: newQty,
            newQty: newQty + dto.quantity,
            reason: dto.notes ?? `Transfer from ${dto.fromBranchId}`,
            referenceId: transferId,
            referenceType: 'transfer',
            createdBy: transferredBy,
          },
        });

        return {
          transferId,
          variantId: dto.variantId,
          fromBranchId: dto.fromBranchId,
          toBranchId: dto.toBranchId,
          quantity: dto.quantity,
        };
      });
    });
  }
}
