import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappProcessor } from './whatsapp.processor';
import { LlmService } from './llm.service';
import { CfoIntentsService } from './cfo-intents.service';
import { AiChatController } from './ai-chat.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'whatsapp-messages' }),
  ],
  controllers: [WhatsappController, AiChatController],
  providers: [
    WhatsappService,
    WhatsappProcessor,
    LlmService,
    CfoIntentsService,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
