import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':roomId/messages')
  getMessages(@Param('roomId') roomId: string, @Query('limit') limit?: string) {
    return this.chatService.getMessages(roomId, limit ? parseInt(limit) : 50);
  }
}
