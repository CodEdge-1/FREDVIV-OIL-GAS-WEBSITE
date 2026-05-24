import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSalesReportDto {
  branchId: string;
  date: string;
  @IsNumber() openingPMS: number;
  @IsNumber() openingAGO: number;
  @IsNumber() soldPMS: number;
  @IsNumber() soldAGO: number;
  @IsNumber() remainingPMS: number;
  @IsNumber() remainingAGO: number;
  @IsOptional() @IsNumber() @Min(0) overage?: number;
  @IsNumber() cardPayments: number;
  @IsNumber() bankTransfers: number;
  @IsNumber() cashPayments: number;
}

const reportSelect = {
  id: true, date: true, status: true, submittedAt: true,
  openingPMS: true, openingAGO: true, soldPMS: true, soldAGO: true,
  remainingPMS: true, remainingAGO: true, overage: true,
  pmsPrice: true, agoPrice: true, totalSales: true,
  cardPayments: true, bankTransfers: true, cashPayments: true,
  branch: { select: { id: true, name: true, location: true } },
  manager: { select: { id: true, name: true } },
};

@Injectable()
export class SalesReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { branchId?: string; date?: string }) {
    return this.prisma.salesReport.findMany({
      where: {
        branchId: filters?.branchId,
        ...(filters?.date ? { date: filters.date } : {}),
      },
      select: reportSelect,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id }, select: reportSelect });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async create(dto: CreateSalesReportDto, managerId: string) {
    const currentPrice = await this.prisma.fuelPrice.findFirst({ orderBy: { effectiveFrom: 'desc' } });
    if (!currentPrice) throw new BadRequestException('No fuel price set by admin');

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    const pmsPrice = currentPrice.pms;
    const agoPrice = currentPrice.ago;
    const totalSales = dto.soldPMS * pmsPrice + dto.soldAGO * agoPrice;
    const totalPayments = dto.cardPayments + dto.bankTransfers + dto.cashPayments;

    return this.prisma.salesReport.create({
      data: {
        branchId: dto.branchId,
        managerId,
        location: branch.location || 'N/A',
        date: dto.date,
        openingPMS: dto.openingPMS,
        openingAGO: dto.openingAGO,
        soldPMS: dto.soldPMS,
        soldAGO: dto.soldAGO,
        remainingPMS: dto.remainingPMS,
        remainingAGO: dto.remainingAGO,
        overage: dto.overage ?? 0,
        pmsPrice,
        agoPrice,
        totalSales,
        cardPayments: dto.cardPayments,
        bankTransfers: dto.bankTransfers,
        cashPayments: dto.cashPayments,
        totalPayments,
      },
      select: reportSelect,
    });
  }

  async submit(id: string, managerId: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.managerId !== managerId) throw new ForbiddenException();
    if (report.status !== 'PENDING') throw new BadRequestException('Report already submitted');

    return this.prisma.salesReport.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      select: reportSelect,
    });
  }

  async approve(id: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'SUBMITTED') throw new BadRequestException('Report not submitted');

    return this.prisma.salesReport.update({
      where: { id },
      data: { status: 'APPROVED' },
      select: reportSelect,
    });
  }
}
