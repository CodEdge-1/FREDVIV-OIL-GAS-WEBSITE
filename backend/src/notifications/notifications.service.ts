import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: any) {
    let recipientId = createNotificationDto.userId || createNotificationDto.recipientId;
    if (recipientId === 'admin') {
      const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (admin) {
        recipientId = admin.id;
      }
    }
    return this.prisma.notification.create({
      data: {
        recipientId,
        title: createNotificationDto.title,
        body: createNotificationDto.body,
      }
    });
  }

  findAll() {
    return this.prisma.notification.findMany();
  }

  findOne(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }
}
