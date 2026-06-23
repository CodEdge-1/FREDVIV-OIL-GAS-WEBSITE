import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BalanceRequestsService {
  constructor(private prisma: PrismaService) {}

  private mapBalanceRequest(r: any) {
    if (!r) return null;
    return {
      ...r,
      requester: r.requester?.name || 'Unknown',
    };
  }

  async findAll() {
    const list = await this.prisma.balanceRequest.findMany({
      orderBy: { requestTime: 'desc' },
      include: { requester: true }
    });
    return list.map((r) => this.mapBalanceRequest(r));
  }

  async findPending() {
    const list = await this.prisma.balanceRequest.findMany({
      where: { status: RequestStatus.PENDING },
      orderBy: { requestTime: 'asc' },
      include: { requester: true }
    });
    return list.map((r) => this.mapBalanceRequest(r));
  }

  async findUserPendingRequest(requesterId: string) {
    return this.prisma.balanceRequest.findFirst({
      where: { requesterId, status: RequestStatus.PENDING },
      orderBy: { requestTime: 'desc' }
    });
  }

  async findUserApprovedRequest(requesterId: string) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.prisma.balanceRequest.findFirst({
      where: { 
        requesterId, 
        status: RequestStatus.APPROVED, 
        pinUsed: false,
        approvedTime: {
          gte: fifteenMinutesAgo
        }
      },
      orderBy: { requestTime: 'desc' }
    });
  }

  async create(requesterId: string, role: Role, period: string = 'ALL_TIME') {
    return this.prisma.balanceRequest.create({
      data: { 
        requesterId, 
        role, 
        status: RequestStatus.PENDING,
        period
      },
    });
  }

  async approve(id: string, rawPin: string) {
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

  async reject(id: string) {
    return this.prisma.balanceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
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

    if (request.approvedTime) {
      const elapsedMs = new Date().getTime() - new Date(request.approvedTime).getTime();
      const fifteenMinutesMs = 15 * 60 * 1000;
      if (elapsedMs > fifteenMinutesMs) {
        await this.prisma.balanceRequest.update({
          where: { id },
          data: { pinUsed: true }
        });
        throw new UnauthorizedException('The PIN has expired (15-minute limit).');
      }
    }

    const isValid = await bcrypt.compare(rawPin, request.adminPin);
    if (!isValid) {
      throw new UnauthorizedException('Incorrect PIN');
    }

    await this.prisma.balanceRequest.update({
      where: { id },
      data: { pinUsed: true }
    });

    return true;
  }
}
