import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { BankAccessRequestsService } from './bank-access-requests.service';
import { CreateBankAccessRequestDto } from './dto/create-bank-access-request.dto';
import { ApproveBankAccessRequestDto } from './dto/approve-bank-access-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('bank-access-requests')
export class BankAccessRequestsController {
  constructor(private readonly service: BankAccessRequestsService) {}

  @Post()
  create(@Body() dto: CreateBankAccessRequestDto) {
    return this.service.create(dto.requesterId, dto.bankId);
  }

  @Get('user/:userId')
  findAllUserRequests(@Param('userId') userId: string) {
    return this.service.findAllUserRequests(userId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('pending')
  findPending() {
    return this.service.findPendingRequests();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveBankAccessRequestDto) {
    return this.service.approveRequest(id, dto.username, dto.password);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.service.rejectRequest(id);
  }
}
