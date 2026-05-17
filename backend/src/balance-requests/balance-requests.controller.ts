import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { BalanceRequestsService } from './balance-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString } from 'class-validator';

class CreateBalanceRequestDto {
  @IsString()
  pin: string;
}

@UseGuards(JwtAuthGuard)
@Controller('balance-requests')
export class BalanceRequestsController {
  constructor(private balanceRequestsService: BalanceRequestsService) {}

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.balanceRequestsService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('pending')
  findPending() {
    return this.balanceRequestsService.findPending();
  }

  @UseGuards(RolesGuard)
  @Roles('ACCOUNTANT', 'AUDITOR')
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateBalanceRequestDto) {
    return this.balanceRequestsService.create(user.id, dto.pin);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.balanceRequestsService.approve(id, user.id);
  }
}
