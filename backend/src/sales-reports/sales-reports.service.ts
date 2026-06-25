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

  @IsOptional()
  customProducts?: any;

  @IsOptional() @IsNumber() previousCashAtHand?: number;
  @IsOptional() @IsNumber() cashToBank?: number;
  @IsOptional() @IsNumber() actualCashAtHand?: number;
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
  customProducts: true,
  previousCashAtHand: true,
  cashToBank: true,
  actualCashAtHand: true,
  footnote: true,
  reviewedById: true,
  reviewedBy: { select: { id: true, name: true, role: true } },
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
    // 1. Lockout check: manager cannot submit a report for a new day if they have any previous unapproved report
    const previousUnapprovedReport = await this.prisma.salesReport.findFirst({
      where: {
        managerId,
        status: { in: ['SUBMITTED', 'PENDING', 'REJECTED'] },
        date: { lt: dto.date },
      },
    });

    if (previousUnapprovedReport) {
      throw new BadRequestException(
        `Cannot create report for ${dto.date}. You have an unapproved sales report for ${previousUnapprovedReport.date} that must be approved first.`
      );
    }

    const currentPrice = await this.prisma.fuelPrice.findFirst({ orderBy: { effectiveFrom: 'desc' } });
    if (!currentPrice) throw new BadRequestException('No fuel price set by admin');

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException('Branch not found');

    const pmsPrice = currentPrice.pms;
    const agoPrice = currentPrice.ago;
    const pmsSales = dto.soldPMS * pmsPrice;
    const agoSales = dto.soldAGO * agoPrice;

    // Calculate custom product sales
    let customSalesTotal = 0;
    let parsedCustomProducts = [];
    if (dto.customProducts) {
      parsedCustomProducts = typeof dto.customProducts === 'string'
        ? JSON.parse(dto.customProducts)
        : dto.customProducts;

      for (const cp of parsedCustomProducts) {
        cp.sales = (Number(cp.sold) || 0) * (Number(cp.price) || 0);
        customSalesTotal += cp.sales;
      }
    }

    const totalSales = pmsSales + agoSales + customSalesTotal;
    const totalPayments = dto.cardPayments + dto.bankTransfers + dto.cashPayments;

    // Check if report already exists for this date and manager
    const existingReportForDate = await this.prisma.salesReport.findFirst({
      where: { managerId, date: dto.date },
    });

    if (existingReportForDate) {
      if (existingReportForDate.status === 'APPROVED' || existingReportForDate.status === 'SUBMITTED') {
        throw new BadRequestException(`Report for ${dto.date} is already ${existingReportForDate.status.toLowerCase()} and locked.`);
      }

      // Update/Upsert the existing report (reactivation)
      const report = await this.prisma.salesReport.update({
        where: { id: existingReportForDate.id },
        data: {
          openingPMS: dto.openingPMS,
          openingAGO: dto.openingAGO,
          soldPMS: dto.soldPMS,
          soldAGO: dto.soldAGO,
          remainingPMS: dto.remainingPMS,
          remainingAGO: dto.remainingAGO,
          overage: (dto.overagePMS ?? 0) + (dto.overageAGO ?? 0),
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
          status: 'SUBMITTED', // Reset status to submitted
          submittedAt: new Date(),
          customProducts: parsedCustomProducts,
          previousCashAtHand: dto.previousCashAtHand ?? 0,
          cashToBank: dto.cashToBank ?? 0,
          actualCashAtHand: dto.actualCashAtHand ?? 0,
          footnote: null, // Clear previous footnote
        },
        select: reportSelect,
      });
      return this.mapReport(report);
    }

    // Create a new report
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
        customProducts: parsedCustomProducts,
        previousCashAtHand: dto.previousCashAtHand ?? 0,
        cashToBank: dto.cashToBank ?? 0,
        actualCashAtHand: dto.actualCashAtHand ?? 0,
      },
      select: reportSelect,
    });
    return this.mapReport(report);
  }

  async submit(id: string, managerId: string) {
    const report = await this.prisma.salesReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.managerId !== managerId) throw new ForbiddenException();
    if (report.status !== 'PENDING' && report.status !== 'REJECTED') throw new BadRequestException('Report already submitted');

    const updated = await this.prisma.salesReport.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      select: reportSelect,
    });
    return this.mapReport(updated);
  }

  async approve(id: string, reviewerId: string) {
    const report = await this.prisma.salesReport.findUnique({
      where: { id },
      include: { manager: true }
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'SUBMITTED' && report.status !== 'PENDING' && report.status !== 'REJECTED') {
      throw new BadRequestException('Report not submitted');
    }

    const updated = await this.prisma.salesReport.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: reviewerId,
      },
      select: reportSelect,
    });

    const reviewer = await this.prisma.user.findUnique({ where: { id: reviewerId } });
    await this.prisma.activityLog.create({
      data: {
        userId: reviewerId,
        action: `Sales report for ${report.date} approved by ${reviewer?.name || 'Reviewer'}`,
        type: 'SALES',
        details: JSON.stringify({ reportId: id, managerName: report.manager?.name }),
      }
    });

    await this.prisma.notification.create({
      data: {
        recipientId: report.managerId,
        title: 'Sales Report Approved',
        body: `Your sales report for ${report.date} has been approved.`,
      }
    });

    return this.mapReport(updated);
  }

  async reject(id: string, reviewerId: string, reason: string) {
    const report = await this.prisma.salesReport.findUnique({
      where: { id },
      include: { manager: true }
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'SUBMITTED' && report.status !== 'PENDING') {
      throw new BadRequestException('Report not submitted');
    }

    const updated = await this.prisma.salesReport.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: reviewerId,
        footnote: reason,
      },
      select: reportSelect,
    });

    const reviewer = await this.prisma.user.findUnique({ where: { id: reviewerId } });
    await this.prisma.activityLog.create({
      data: {
        userId: reviewerId,
        action: `Sales report for ${report.date} rejected by ${reviewer?.name || 'Reviewer'}`,
        type: 'SALES',
        details: JSON.stringify({ reportId: id, footnote: reason, managerName: report.manager?.name }),
      }
    });

    await this.prisma.notification.create({
      data: {
        recipientId: report.managerId,
        title: 'Sales Report Rejected',
        body: `Your sales report for ${report.date} was rejected: "${reason}". Please correct and resubmit.`,
      }
    });

    return this.mapReport(updated);
  }
}
