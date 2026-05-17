import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { TransactionsService, CreateTransactionDto } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  findAll(@Query('type') type?: TransactionType) {
    return this.transactionsService.findAll(type);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }
}
