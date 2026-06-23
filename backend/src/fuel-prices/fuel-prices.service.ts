import { Injectable } from '@nestjs/common';
import { IsNumber, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class SetPriceDto {
  @IsNumber()
  @Min(0)
  pmsPrice: number;

  @IsNumber()
  @Min(0)
  agoPrice: number;
}

@Injectable()
export class FuelPricesService {
  constructor(private prisma: PrismaService) {}

  async getCurrent() {
    return this.prisma.fuelPrice.findFirst({
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getHistory() {
    const history = await this.prisma.priceHistory.findMany({
      orderBy: { date: 'desc' },
      take: 20,
    });
    return history.map(h => ({
      ...h,
      date: h.date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }

  async setPrice(dto: SetPriceDto, userId: string) {
    const current = await this.getCurrent();
    const oldPms = current ? current.pms : 0;
    const oldAgo = current ? current.ago : 0;

    const newFuelPrice = await this.prisma.fuelPrice.create({
      data: {
        pms: dto.pmsPrice,
        ago: dto.agoPrice,
      },
    });

    if (oldPms !== dto.pmsPrice) {
      await this.prisma.priceHistory.create({
        data: {
          product: 'PMS',
          oldPrice: oldPms,
          newPrice: dto.pmsPrice,
          adminId: userId,
        },
      });
    }

    if (oldAgo !== dto.agoPrice) {
      await this.prisma.priceHistory.create({
        data: {
          product: 'AGO',
          oldPrice: oldAgo,
          newPrice: dto.agoPrice,
          adminId: userId,
        },
      });
    }

    return newFuelPrice;
  }

  async deleteHistoryRecord(id: string) {
    return this.prisma.priceHistory.delete({
      where: { id },
    });
  }
}
