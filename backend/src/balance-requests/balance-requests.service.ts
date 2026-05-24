import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BalanceRequestsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.balanceRequest.findMany({
      orderBy: { requestTime: 'desc' },
      include: { requester: true }
    });
  }

  async findPending() {
    return this.prisma.balanceRequest.findMany({
      where: { status: RequestStatus.PENDING },
      orderBy: { requestTime: 'asc' },
      include: { requester: true }
    });
  }

  async create(requesterId: string, role: Role) {
    return this.prisma.balanceRequest.create({
      data: { 
        requesterId, 
        role, 
        status: RequestStatus.PENDING 
      },
    });
  }

  async approve(id: string, rawPin: string) {
    // Hook: Hash the PIN before saving to DB
    const hashedPin = await bcrypt.hash(rawPin, 10);

    return this.prisma.balanceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.APPROVED,
        adminPin: hashedPin,
        approvedTime: new Date(),
      },
    });
  }

  async validatePin(id: string, requesterId: string, rawPin: string) {
    const request = await this.prisma.balanceRequest.findUnique({
      where: { id },
    });

    if (!request || request.requesterId !== requesterId || request.pinUsed) {
      throw new UnauthorizedException('Invalid or already used request');
    }

    // Hook: Compare hashed PIN
    const isValid = await bcrypt.compare(rawPin, request.adminPin);
    if (!isValid) {
      throw new UnauthorizedException('Incorrect PIN');
    }

    // Mark as used immediately to prevent replay attacks
    await this.prisma.balanceRequest.update({
      where: { id },
      data: { pinUsed: true }
    });

    return true;
  }
}