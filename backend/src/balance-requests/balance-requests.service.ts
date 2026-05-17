import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const requestSelect = {
  id: true, status: true, approvedAt: true, expiresAt: true, createdAt: true,
  requestedBy: { select: { id: true, name: true, role: true } },
  approvedBy: { select: { id: true, name: true } },
};

@Injectable()
export class BalanceRequestsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.balanceRequest.findMany({
      select: requestSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findPending() {
    return this.prisma.balanceRequest.findMany({
      where: { status: 'PENDING' },
      select: requestSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, pin: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.pinHash) throw new BadRequestException('PIN not set for this account');

    const pinMatch = await bcrypt.compare(pin, user.pinHash);
    if (!pinMatch) throw new UnauthorizedException('Invalid PIN');

    return this.prisma.balanceRequest.create({
      data: { requestedById: userId },
      select: requestSelect,
    });
  }

  async approve(id: string, adminId: string) {
    const req = await this.prisma.balanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'PENDING') throw new BadRequestException('Request already processed');

    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds

    return this.prisma.balanceRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: adminId,
        approvedAt: new Date(),
        expiresAt,
      },
      select: requestSelect,
    });
  }

  async expire(id: string) {
    return this.prisma.balanceRequest.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });
  }
}
