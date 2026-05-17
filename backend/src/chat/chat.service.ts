import { Injectable } from '@nestjs/common';
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

  async saveMessage(senderId: string, roomId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { senderId, roomId, content },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
