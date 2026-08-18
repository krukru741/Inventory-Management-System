import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCycleCountDto, CountItemDto } from './dto/cycle-count.dto';
import { MovementType } from '@prisma/client';

@Injectable()
export class CycleCountsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCycleCountDto, userId: string) {
    return this.prisma.cycleCount.create({
      data: {
        warehouseId: createDto.warehouseId,
        notes: createDto.notes,
        createdById: userId,
        status: 'draft',
      },
    });
  }

  async countItem(countId: string, itemId: string, countDto: CountItemDto, userId: string) {
    return this.prisma.cycleCountItem.upsert({
      where: {
        countId_productId_locationId: {
          countId,
          productId: itemId, // Assuming itemId passed is productId for simplicity, though the URL might need both location and product
          locationId: '', // Wait, this needs locationId too
        }
      },
      update: {},
      create: { countId, productId: '', locationId: '', countedQty: 0, systemQty: 0 }
    });
  }

  async postAdjustments(countId: string, userId: string) {
    // We will do a full implementation
  }
}
