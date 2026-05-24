import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateExpenseDto {
  branchId: string;
  type: string;
  description: string;
  amount: number;
  date: string;
}

export class ReviewExpenseDto {
  action: 'approve' | 'reject';
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

  findAll(branchId?: string) {
    return this.prisma.expense.findMany({
      where: { branchId },
      select: expenseSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id }, select: expenseSelect });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  create(dto: CreateExpenseDto, userId: string) {
    return this.prisma.expense.create({
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
  }

  async review(id: string, dto: ReviewExpenseDto, adminId: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== 'PENDING') throw new BadRequestException('Expense already reviewed');

    return this.prisma.expense.update({
      where: { id },
      data: {
        status: dto.action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedById: adminId,
      },
      select: expenseSelect,
    });
  }
}
