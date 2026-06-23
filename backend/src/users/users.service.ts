import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      where: {
        status: { not: 'INACTIVE' },
      },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, branchId: true, branch: true, location: true,
        phone: true,
        createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(user => ({
      ...user,
      branch: user.branch?.name || null,
      location: user.location || user.branch?.location || null,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, branchId: true, branch: true, location: true,
        phone: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      ...user,
      branch: user.branch?.name || null,
      location: user.location || user.branch?.location || null,
    };
  }

  async getUnreadNotificationCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, read: false },
    });
    return { count };
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, read: false },
      data: { read: true },
    });
    return { success: true };
  }

  async markNotificationRead(userId: string, notifId: string, read: boolean) {
    return this.prisma.notification.updateMany({
      where: { id: notifId, recipientId: userId },
      data: { read },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const pinHash = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;

    let finalBranchId = dto.branchId;
    if (!finalBranchId && dto.branch) {
      let branchRecord = await this.prisma.branch.findUnique({ where: { name: dto.branch } });
      if (!branchRecord) {
        branchRecord = await this.prisma.branch.create({
          data: { name: dto.branch, location: dto.location }
        });
      }
      finalBranchId = branchRecord.id;
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        pinHash,
        role: dto.role,
        branchId: finalBranchId || null,
        location: dto.location || null,
        phone: dto.phone || null,
      },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, branchId: true, branch: true, location: true,
        phone: true,
        createdAt: true,
      },
    });
    return {
      ...user,
      branch: user.branch?.name || null,
      location: user.location || user.branch?.location || null,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    let finalBranchId = dto.branchId;
    
    // Resolve branch name if passed
    if (dto.branch !== undefined) {
      if (dto.branch) {
        let branchRecord = await this.prisma.branch.findUnique({ where: { name: dto.branch } });
        if (!branchRecord) {
          branchRecord = await this.prisma.branch.create({
            data: { name: dto.branch, location: dto.location }
          });
        }
        finalBranchId = branchRecord.id;
      } else {
        finalBranchId = null;
      }
    }

    const updateData: any = {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      status: dto.status,
      phone: dto.phone,
      location: dto.location,
    };

    if (finalBranchId !== undefined || dto.branch !== undefined) {
      updateData.branchId = finalBranchId;
    }

    // Clean undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true,
        status: true, branchId: true, branch: true, location: true,
        phone: true,
        updatedAt: true,
      },
    });

    return {
      ...user,
      branch: user.branch?.name || null,
      location: user.location || user.branch?.location || null,
    };
  }

  async updatePassword(id: string, password: string) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete notifications
      await tx.notification.deleteMany({ where: { recipientId: id } });
      
      // 2. Delete activity logs
      await tx.activityLog.deleteMany({ where: { userId: id } });
      
      // 3. Delete balance requests
      await tx.balanceRequest.deleteMany({ where: { requesterId: id } });
      
      // 4. Delete bank access requests
      await tx.bankAccessRequest.deleteMany({ where: { requesterId: id } });
      
      // 5. Delete chat messages
      await tx.chatMessage.deleteMany({ where: { senderId: id } });
      
      // 6. Delete expenses where the user is manager
      await tx.expense.deleteMany({ where: { managerId: id } });
      
      // 7. Update approved expenses (approvedById is nullable, so set null)
      await tx.expense.updateMany({
        where: { approvedById: id },
        data: { approvedById: null },
      });
      
      // 8. Delete sales reports
      await tx.salesReport.deleteMany({ where: { managerId: id } });
      
      // 9. Delete the user
      const user = await tx.user.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          location: true,
          branch: { select: { name: true } },
        }
      });
      return {
        ...user,
        branch: user.branch?.name || null,
        location: user.location || null,
      };
    }, {
      timeout: 20000,
    });
  }
}
