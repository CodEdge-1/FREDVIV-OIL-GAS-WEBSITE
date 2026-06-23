import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { IsString, IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  date: string;
}

export class ReviewExpenseDto {
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

const expenseSelect = {
  id: true, type: true, description: true, amount: true, date: true,
  status: true,
  branch: { select: { id: true, name: true, location: true } },
  manager: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  createdAt: true,
};

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private mapExpense(e: any) {
    if (!e) return null;
    return {
      ...e,
      branch: e.branch?.name || 'N/A',
      managerId: e.manager?.id || null,
      managerName: e.manager?.name || 'N/A',
      approvedByName: e.approvedBy?.name || null,
    };
  }

  async findAll(branchId?: string, managerId?: string) {
    const expenses = await this.prisma.expense.findMany({
      where: { branchId, managerId },
      select: expenseSelect,
      orderBy: { createdAt: 'desc' },
    });
    return expenses.map((e) => this.mapExpense(e));
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id }, select: expenseSelect });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.mapExpense(expense);
  }

  async create(dto: CreateExpenseDto, userId: string) {
    const expense = await this.prisma.expense.create({
      data: {
        branchId: dto.branchId,
        managerId: userId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        date: dto.date,
      },
      select: expenseSelect,
    });
    return this.mapExpense(expense);
  }

  async review(id: string, dto: ReviewExpenseDto, adminId: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== 'PENDING') throw new BadRequestException('Expense already reviewed');

    const updated = await this.prisma.expense.update({
      where: { id },
      data: {
        status: dto.action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedById: adminId,
      },
      select: expenseSelect,
    });
    return this.mapExpense(updated);
  }
}
