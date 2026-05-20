import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { LlmService } from './llm.service';
import { CfoIntent } from './cfo-intents.service';
import { ForbiddenException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';

const mockQueue = { add: jest.fn().mockResolvedValue({}) };

describe('WhatsappService', () => {
  let service: WhatsappService;
  let llmService: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        LlmService,
        {
          provide: getQueueToken('whatsapp-messages'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
    llmService = module.get<LlmService>(LlmService);
    jest.clearAllMocks();
  });

  describe('verifyWebhook', () => {
    it('returns challenge when verify_token matches', () => {
      process.env.WHATSAPP_VERIFY_TOKEN = 'nexus_webhook_secret_dev';
      const result = service.verifyWebhook({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'nexus_webhook_secret_dev',
        'hub.challenge': 'CHALLENGE_123',
      });
      expect(result).toBe('CHALLENGE_123');
    });

    it('throws ForbiddenException when verify_token is wrong', () => {
      expect(() =>
        service.verifyWebhook({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong_token',
          'hub.challenge': 'CHALLENGE_123',
        }),
      ).toThrow(ForbiddenException);
    });
  });

  describe('extractMessage', () => {
    it('extracts from dev mode body', () => {
      const result = service.extractMessage(
        { from: '573001234567', message: 'cuánto vendí hoy?' },
        true,
      );
      expect(result).toEqual({ from: '573001234567', message: 'cuánto vendí hoy?' });
    });

    it('extracts from Meta webhook body', () => {
      const metaBody = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [{ from: '573001234567', text: { body: 'hola' } }],
            },
          }],
        }],
      };
      const result = service.extractMessage(metaBody, false);
      expect(result).toEqual({ from: '573001234567', message: 'hola' });
    });

    it('returns null for empty dev body', () => {
      const result = service.extractMessage({}, true);
      expect(result).toBeNull();
    });
  });

  describe('queueMessage', () => {
    it('calls queue.add with correct data', async () => {
      await service.queueMessage('573001234567', 'test message');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process',
        { from: '573001234567', message: 'test message' },
        expect.any(Object),
      );
    });
  });
});

describe('LlmService keyword fallback', () => {
  let llmService: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmService],
    }).compile();
    llmService = module.get<LlmService>(LlmService);
    // No API key → uses fallback
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('classifyIntent("cuánto vendí hoy") → VENTAS_HOY', async () => {
    const intent = await llmService.classifyIntent('cuánto vendí hoy');
    expect(intent).toBe(CfoIntent.VENTAS_HOY);
  });

  it('classifyIntent("buen día") → UNKNOWN', async () => {
    const intent = await llmService.classifyIntent('buen día');
    expect(intent).toBe(CfoIntent.UNKNOWN);
  });

  it('classifyIntent("vendí ayer?") → VENTAS_AYER', async () => {
    const intent = await llmService.classifyIntent('cuánto vendí ayer');
    expect(intent).toBe(CfoIntent.VENTAS_AYER);
  });

  it('classifyIntent("qué productos se están agotando") → STOCK_BAJO', async () => {
    const intent = await llmService.classifyIntent('qué productos se están agotando');
    expect(intent).toBe(CfoIntent.STOCK_BAJO);
  });
});
