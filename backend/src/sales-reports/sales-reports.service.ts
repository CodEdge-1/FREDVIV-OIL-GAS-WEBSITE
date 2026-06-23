import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IsNumber, IsOptional, Min, IsString, IsNotEmpty } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSalesReportDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsNumber() openingPMS: number;
  @IsNumber() openingAGO: number;
  @IsNumber() soldPMS: number;
  @IsNumber() soldAGO: number;
  @IsNumber() remainingPMS: number;
  @IsNumber() remainingAGO: number;
  @IsOptional() @IsNumber() @Min(0) overage?: number;
  @IsOptional() @IsNumber() @Min(0) overagePMS?: number;
  @IsOptional() @IsNumber() @Min(0) overageAGO?: number;
  @IsNumber() cardPayments: number;
  @IsNumber() bankTransfers: number;
  @IsNumber() cashPayments: number;
}

const reportSelect = {
  id: true, date: true, status: true, submittedAt: true,
  openingPMS: true, openingAGO: true, soldPMS: true, soldAGO: true,
  remainingPMS: true, remainingAGO: true, overage: true,
  overagePMS: true, overageAGO: true,
  pmsPrice: true, agoPrice: true, totalSales: true,
  cardPayments: true, bankTransfers: true, cashPayments: true, totalPayments: true,
  branch: { select: { id: true, name: true, location: true } },
  manager: { select: { id: true, name: true } },
};

@Injectable()
export class SalesReportsService {
  constructor(private prisma: PrismaService) {}

  private mapReport(r: any) {
    if (!r) return null;
    return {
      ...r,
      branch: r.branch?.name || 'N/A',
      location: r.location || r.branch?.location || 'N/A',
      managerId: r.manager?.id || null,
      managerName: r.manager?.name || 'N/A',
    };
  }

  async findAll(filters?: { branchId?: string; date?: string; managerId?: string }) {
    const reports = await this.prisma.salesReport.findMany({
      where: {
        branchId: filters?.branchId,
        managerId: filters?.managerId,
        ...(filters?.date ? { date: filters.date } : {}),
      },
      select: reportSelect,
      orderBy: { date: 'desc' },
    });
    return reports.map((r) => this.mapReport(r));
  }

  async findForAudit() {
    const reports = await this.prisma.salesReport.findMany({
      where: {
        status: { in: ['SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING'] },
      },
      select: reportSelect,
      orderBy: { date: 'desc' },
    });
    return reports.map((r) => this.mapReport(r));
  }

  async findTodayForManager(managerId: string, date?: string) {
    const today = date || new Date().toISOString().split('T')[0];
    const report = await this.prisma.salesReport.findFirst({
      where: { managerId, date: today },
      select: reportSelect,
    });
    return this.mapReport(report);
  }

  async findOne(id: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id }, select: reportSelect });
    if (!report) throw new NotFoundException('Report not found');
    return this.mapReport(report);
  }

  async create(dto: CreateSalesReportDto, managerId: string) {
    const currentPrice = await this.prisma.fuelPrice.findFirst({ orderBy: { effectiveFrom: 'desc' } });
    if (!currentPrice) throw new BadRequestException('No fuel price set by admin');

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    const pmsPrice = currentPrice.pms;
    const agoPrice = currentPrice.ago;
    const pmsSales = dto.soldPMS * pmsPrice;
    const agoSales = dto.soldAGO * agoPrice;
    const totalSales = pmsSales + agoSales;
    const totalPayments = dto.cardPayments + dto.bankTransfers + dto.cashPayments;

    const report = await this.prisma.salesReport.create({
      data: {
        branchId: dto.branchId,
        managerId,
        location: branch.location || 'N/A',
        date: dto.date,
        status: 'SUBMITTED',
        openingPMS: dto.openingPMS,
        openingAGO: dto.openingAGO,
        soldPMS: dto.soldPMS,
        soldAGO: dto.soldAGO,
        remainingPMS: dto.remainingPMS,
        remainingAGO: dto.remainingAGO,
        overage: dto.overage ?? 0,
        overagePMS: dto.overagePMS ?? 0,
        overageAGO: dto.overageAGO ?? 0,
        pmsPrice,
        agoPrice,
        pmsSales,
        agoSales,
        totalSales,
        cardPayments: dto.cardPayments,
        bankTransfers: dto.bankTransfers,
        cashPayments: dto.cashPayments,
        totalPayments,
      },
      select: reportSelect,
    });
    return this.mapReport(report);
  }

  async submit(id: string, managerId: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.managerId !== managerId) throw new ForbiddenException();
    if (report.status !== 'PENDING') throw new BadRequestException('Report already submitted');

    const updated = await this.prisma.salesReport.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      select: reportSelect,
    });
    return this.mapReport(updated);
  }

  async approve(id: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'SUBMITTED' && report.status !== 'PENDING') {
      throw new BadRequestException('Report not submitted');
    }

    const updated = await this.prisma.salesReport.update({
      where: { id },
      data: { status: 'APPROVED' },
      select: reportSelect,
    });
    return this.mapReport(updated);
  }

  async reject(id: string, reason?: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'SUBMITTED' && report.status !== 'PENDING') {
      throw new BadRequestException('Report not submitted');
    }

    const updated = await this.prisma.salesReport.update({
      where: { id },
      data: { status: 'REJECTED' },
      select: reportSelect,
    });
    return this.mapReport(updated);
  }
}
