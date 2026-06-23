import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(roomId: string, limit = 50) {
    return this.prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getUnreadCount(userId: string) {
    return { count: 0 };
  }

  async saveMessage(
    senderId: string, 
    roomId: string, 
    content: string, 
    attachment?: { url: string; name: string; type: string; size: number }
  ) {
    return this.prisma.chatMessage.create({
      data: { 
        senderId, 
        roomId, 
        text: content,
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
        attachmentType: attachment?.type,
        attachmentSize: attachment?.size,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getAdminUserIds() {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    return admins.map(a => a.id);
  }

  async getLastMessages(userId: string, role: string) {
    let roomIds = ['broadcast'];
    
    if (role === 'ADMIN') {
      // Find all rooms in the system
      const rooms = await this.prisma.chatMessage.findMany({
        select: { roomId: true },
        distinct: ['roomId'],
      });
      roomIds = Array.from(new Set(['broadcast', ...rooms.map(r => r.roomId)]));
    } else {
      roomIds.push(`dm-${userId}`);
    }

    const lastMessages = await Promise.all(
      roomIds.map(async (roomId) => {
        const msg = await this.prisma.chatMessage.findFirst({
          where: { roomId },
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        });
        return msg ? { roomId, message: msg } : null;
      })
    );

    return lastMessages.filter(item => item !== null);
  }

  async deleteMessage(id: string, userId: string, role: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (role !== 'ADMIN' && message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    return this.prisma.chatMessage.delete({
      where: { id },
    });
  }
}
