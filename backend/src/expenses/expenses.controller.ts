import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExpensesService, CreateExpenseDto, ReviewExpenseDto } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.expensesService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.expensesService.create(dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/review')
  review(@Param('id') id: string, @Body() dto: ReviewExpenseDto, @CurrentUser() user: any) {
    return this.expensesService.review(id, dto, user.id);
  }
}
