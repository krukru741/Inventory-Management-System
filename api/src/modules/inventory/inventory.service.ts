import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, MovementType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  async getStockSummary(paginationDto: PaginationDto, productId?: string) {
    // Prefer the DB view — it aggregates across batches/locations and
    // computes available_qty (on_hand - reserved) for us.
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM v_stock_summary
      ${productId ? Prisma.sql`WHERE product_id = ${productId}::uuid` : Prisma.empty}
      ORDER BY sku
      OFFSET ${paginationDto.skip} LIMIT ${paginationDto.limit}
    `;

    const [{ count }] = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM v_stock_summary
      ${productId ? Prisma.sql`WHERE product_id = ${productId}::uuid` : Prisma.empty}
    `;

    return {
      data: rows,
      meta: {
        total: Number(count),
        page: paginationDto.page,
        limit: paginationDto.limit,
      },
    };
  }

  async getLowStockAlerts() {
    return this.prisma.$queryRaw`SELECT * FROM v_low_stock_alerts`;
  }

  async adjustStock(adjustDto: AdjustInventoryDto, userId?: string) {
    if (adjustDto.quantityChange === 0) {
      throw new BadRequestException('Quantity change cannot be zero');
    }

    const movementType =
      adjustDto.quantityChange > 0
        ? MovementType.adjustment_in
        : MovementType.adjustment_out;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // ---------------------------------------------------------------
        // Idempotency check FIRST, before taking any locks. If this exact
        // request already succeeded, return the original movement rather
        // than erroring or double-applying the adjustment.
        // ---------------------------------------------------------------
        if (adjustDto.idempotencyKey) {
          const existing = await tx.stockMovement.findUnique({
            where: { idempotencyKey: adjustDto.idempotencyKey },
          });
          if (existing) {
            return existing;
          }
        }

        // ---------------------------------------------------------------
        // Lock the target inventory row (or the "gap" if it doesn't exist
        // yet) for the duration of this transaction. Postgres advisory
        // locks are used instead of SELECT ... FOR UPDATE because the
        // inventory row may not exist yet on the very first movement for
        // a given product+location+batch layer — you can't row-lock a
        // row that isn't there. The lock key is derived deterministically
        // from the stock-layer identity so concurrent requests for the
        // SAME layer serialize, while different layers proceed in
        // parallel.
        // ---------------------------------------------------------------
        const lockKey = [
          adjustDto.productId,
          adjustDto.locationId,
          adjustDto.variantId ?? '',
          adjustDto.batchNumber ?? '',
          adjustDto.lotNumber ?? '',
        ].join('|');

        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        // Now safe to read — no concurrent transaction can be mid-flight
        // on this same stock layer.
        const currentStock = await tx.inventory.findFirst({
          where: {
            productId: adjustDto.productId,
            locationId: adjustDto.locationId,
            variantId: adjustDto.variantId ?? null,
            batchNumber: adjustDto.batchNumber ?? null,
            lotNumber: adjustDto.lotNumber ?? null,
          },
        });

        const currentQty = currentStock
          ? currentStock.quantity
          : new Prisma.Decimal(0);
        const delta = new Prisma.Decimal(adjustDto.quantityChange);
        const newQty = currentQty.plus(delta);

        if (newQty.lessThan(0)) {
          throw new BadRequestException(
            `Insufficient stock. Current: ${currentQty.toString()}, ` +
            `requested reduction: ${delta.abs().toString()}`,
          );
        }

        // Reserved-qty guard: don't let an adjustment drop on-hand stock
        // below what's already allocated to open sales orders.
        if (
          currentStock &&
          newQty.lessThan(currentStock.reservedQty)
        ) {
          throw new BadRequestException(
            `Cannot reduce stock below reserved quantity ` +
            `(${currentStock.reservedQty.toString()} reserved).`,
          );
        }

        // ---------------------------------------------------------------
        // Insert the ledger row. The AFTER INSERT trigger
        // (sync_inventory_on_movement) upserts `inventory` using
        // balance_after, so we don't touch `inventory` directly here —
        // but because we're still holding the advisory lock, no other
        // transaction can race us between this insert and the trigger's
        // upsert completing.
        // ---------------------------------------------------------------
        const movement = await tx.stockMovement.create({
          data: {
            productId: adjustDto.productId,
            locationId: adjustDto.locationId,
            variantId: adjustDto.variantId,
            movementType,
            quantity: delta.abs(),
            balanceAfter: newQty,
            batchNumber: adjustDto.batchNumber,
            lotNumber: adjustDto.lotNumber,
            idempotencyKey: adjustDto.idempotencyKey,
            reason: adjustDto.reason,
            performedById: userId,
          },
        });

        return movement;
      });
    } catch (err) {
      // Unique violation on idempotency_key: a concurrent request with the
      // same key beat us to it after our pre-check. Fetch and return it
      // rather than surfacing a raw DB error.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        adjustDto.idempotencyKey
      ) {
        const existing = await this.prisma.stockMovement.findUnique({
          where: { idempotencyKey: adjustDto.idempotencyKey },
        });
        if (existing) return existing;
        throw new ConflictException('Duplicate request could not be resolved.');
      }

      // Foreign key violation: bad productId/locationId/variantId.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new BadRequestException(
          'One or more referenced records (product, location, or variant) do not exist.',
        );
      }

      throw err;
    }
  }
}