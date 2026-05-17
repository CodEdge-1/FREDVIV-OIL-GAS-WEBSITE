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
      include: { setBy: { select: { id: true, name: true } } },
    });
  }

  async getHistory() {
    return this.prisma.fuelPrice.findMany({
      orderBy: { effectiveFrom: 'desc' },
      take: 20,
      include: { setBy: { select: { id: true, name: true } } },
    });
  }

  async setPrice(dto: SetPriceDto, userId: string) {
    return this.prisma.fuelPrice.create({
      data: {
        pmsPrice: dto.pmsPrice,
        agoPrice: dto.agoPrice,
        setById: userId,
      },
      include: { setBy: { select: { id: true, name: true } } },
    });
  }
}
