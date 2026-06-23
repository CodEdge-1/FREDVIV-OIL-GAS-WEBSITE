import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatUploadController } from './chat-upload.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController, ChatUploadController],
})
export class ChatModule {}
