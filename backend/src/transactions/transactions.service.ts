import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class CreateTransactionDto {
  reference: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
}

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  findAll(type?: TransactionType) {
    return this.prisma.transaction.findMany({
      where: { type },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: CreateTransactionDto) {
    const lastTransaction = await this.prisma.transaction.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const previousBalance = lastTransaction?.balance || 0;
    const newBalance = dto.type === 'CREDIT' ? previousBalance + dto.amount : previousBalance - dto.amount;

    return this.prisma.transaction.create({
      data: {
        reference: dto.reference,
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        date: new Date(dto.date),
        balance: newBalance,
      },
    });
  }
}
