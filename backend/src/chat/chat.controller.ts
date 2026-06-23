import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get('conversations/last-messages')
  getLastMessages(@Req() req: any) {
    const userId = req.user.id || req.user.userId || req.user.sub;
    const role = req.user.role;
    return this.chatService.getLastMessages(userId, role);
  }

  @Get('unread-count/:userId')
  getUnreadCount(@Param('userId') userId: string) {
    return this.chatService.getUnreadCount(userId);
  }

  @Get(':roomId/messages')
  getMessages(@Param('roomId') roomId: string, @Query('limit') limit?: string) {
    return this.chatService.getMessages(roomId, limit ? parseInt(limit) : 50);
  }

  @Post(':roomId/messages')
  saveMessage(
    @Req() req: any,
    @Param('roomId') roomId: string,
    @Body() body: { content: string; attachment?: any }
  ) {
    return this.chatService.saveMessage(req.user.id || req.user.userId || req.user.sub, roomId, body.content, body.attachment);
  }

  @Delete('messages/:id')
  async deleteMessage(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId || req.user.sub;
    const role = req.user.role;
    const deletedMessage = await this.chatService.deleteMessage(id, userId, role);
    
    // Broadcast message deletion event to other users
    this.chatGateway.broadcastMessageDeletion(deletedMessage.roomId, id, deletedMessage.senderId);
    
    return { success: true, id };
  }
}
