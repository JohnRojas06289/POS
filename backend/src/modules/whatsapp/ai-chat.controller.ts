import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LlmService } from './llm.service';
import { CfoIntentsService } from './cfo-intents.service';
import { ChatDto } from './dto/chat.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('ai')
@Controller('ai')
export class AiChatController {
  constructor(
    private readonly llmService: LlmService,
    private readonly cfoIntentsService: CfoIntentsService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'AI CFO chat for dashboard' })
  async chat(
    @Body() dto: ChatDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ response: string; intent: string }> {
    const intent = await this.llmService.classifyIntent(dto.message);
    const data = await this.cfoIntentsService.getDataForIntent(intent, user.schemaName);
    const response = await this.llmService.generateResponse(
      dto.message,
      intent,
      data,
      user.tenantId,
    );

    return { response, intent };
  }
}
