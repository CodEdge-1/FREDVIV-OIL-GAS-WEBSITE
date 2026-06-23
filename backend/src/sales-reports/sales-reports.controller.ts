import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalesReportsService, CreateSalesReportDto } from './sales-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('sales-reports')
export class SalesReportsController {
  constructor(private salesReportsService: SalesReportsService) {}

  @Get()
  findAll(
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
    @Query('managerId') managerId?: string,
  ) {
    return this.salesReportsService.findAll({ branchId, date, managerId });
  }

  @Get('today/:managerId')
  findTodayForManager(@Param('managerId') managerId: string, @Query('date') date?: string) {
    return this.salesReportsService.findTodayForManager(managerId, date);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AUDITOR')
  @Get('audit')
  findForAudit() {
    return this.salesReportsService.findForAudit();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesReportsService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @Post()
  create(@Body() dto: CreateSalesReportDto, @CurrentUser() user: any) {
    return this.salesReportsService.create(dto, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @Patch(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesReportsService.submit(id, user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AUDITOR')
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.salesReportsService.approve(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AUDITOR')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.salesReportsService.reject(id, reason);
  }
}
