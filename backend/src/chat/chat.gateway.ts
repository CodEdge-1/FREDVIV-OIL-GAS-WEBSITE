import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, { userId: string; name: string; role: string }>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'fredviv-secret',
      });
      this.connectedUsers.set(client.id, {
        userId: payload.sub,
        name: payload.name || payload.email,
        role: payload.role,
      });
      client.data.userId = payload.sub;
      
      // Auto-join the user to their own personal room and the broadcast room
      await client.join(`user-${payload.sub}`);
      await client.join('broadcast');
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() roomId: string) {
    client.join(roomId);
    const messages = await this.chatService.getMessages(roomId);
    client.emit('room-history', messages);
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      roomId: string; 
      content: string; 
      attachment?: { url: string; name: string; type: string; size: number } 
    },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const message = await this.chatService.saveMessage(userId, data.roomId, data.content, data.attachment);
    
    if (data.roomId === 'broadcast') {
      this.server.to('broadcast').emit('new-message', message);
    } else if (data.roomId.startsWith('dm-')) {
      const idsPart = data.roomId.replace('dm-', '');
      const userIds = idsPart.includes('_') ? idsPart.split('_') : [idsPart];

      // Route message to both DM participants' personal rooms
      for (const uid of userIds) {
        this.server.to(`user-${uid}`).emit('new-message', message);
      }

      // Also route the message to all Admins' personal rooms so they can monitor
      const adminIds = await this.chatService.getAdminUserIds();
      for (const adminId of adminIds) {
        if (!userIds.includes(adminId)) {
          this.server.to(`user-${adminId}`).emit('new-message', message);
        }
      }
    }
  }

  broadcastMessageDeletion(roomId: string, messageId: string, senderId: string) {
    if (roomId === 'broadcast') {
      this.server.to('broadcast').emit('message-deleted', { roomId, messageId });
    } else if (roomId.startsWith('dm-')) {
      const idsPart = roomId.replace('dm-', '');
      const userIds = idsPart.includes('_') ? idsPart.split('_') : [idsPart];

      for (const uid of userIds) {
        this.server.to(`user-${uid}`).emit('message-deleted', { roomId, messageId });
      }

      this.chatService.getAdminUserIds().then(adminIds => {
        for (const adminId of adminIds) {
          if (!userIds.includes(adminId)) {
            this.server.to(`user-${adminId}`).emit('message-deleted', { roomId, messageId });
          }
        }
      });
    }
  }
}
