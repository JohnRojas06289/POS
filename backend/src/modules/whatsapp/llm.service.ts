import { Injectable, Logger } from '@nestjs/common';
import { CfoIntent } from './cfo-intents.service';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';
  private readonly model = 'claude-sonnet-4-20250514';

  async classifyIntent(message: string): Promise<CfoIntent> {
    if (!this.apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not set — using keyword fallback');
      return this.keywordFallback(message);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 50,
          messages: [
            {
              role: 'user',
              content: `Clasifica este mensaje de un comerciante colombiano en uno de estos intents exactos:
VENTAS_HOY | VENTAS_AYER | STOCK_BAJO | PRODUCTO_TOP | DEUDAS_CLIENTES | RESUMEN_SEMANA | UNKNOWN

Mensaje: "${message}"
Responde SOLO con el nombre del intent, sin puntuación ni explicación.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.error(`Anthropic API error: ${response.status}`);
        return this.keywordFallback(message);
      }

      const data = await response.json() as { content: Array<{ text: string }> };
      const intent = data.content[0]?.text?.trim() as CfoIntent;
      return Object.values(CfoIntent).includes(intent) ? intent : CfoIntent.UNKNOWN;
    } catch (error) {
      this.logger.error('classifyIntent failed', error);
      return this.keywordFallback(message);
    }
  }

  async generateResponse(
    originalMessage: string,
    intent: CfoIntent,
    data: unknown,
    businessName: string,
  ): Promise<string> {
    if (!this.apiKey) {
      return this.fallbackResponse(intent, data);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 300,
          system: `Eres el CFO virtual de ${businessName}, un asistente financiero amigable para comerciantes colombianos. Hablas de manera cálida y directa. Usas pesos colombianos formateados así: $1.250.000 (punto como separador de miles). Máximo 3 párrafos cortos. Usa emojis apropiados. Termina con un consejo accionable breve si aplica.`,
          messages: [
            {
              role: 'user',
              content: `El comerciante preguntó: "${originalMessage}"\n\nDatos actuales del negocio:\n${JSON.stringify(data, null, 2)}\n\nGenera una respuesta útil y concisa.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.error(`Anthropic API error: ${response.status}`);
        return this.fallbackResponse(intent, data);
      }

      const result = await response.json() as { content: Array<{ text: string }> };
      return result.content[0]?.text ?? this.fallbackResponse(intent, data);
    } catch (error) {
      this.logger.error('generateResponse failed', error);
      return this.fallbackResponse(intent, data);
    }
  }

  private keywordFallback(message: string): CfoIntent {
    const lower = message.toLowerCase();
    if (/hoy|vendí hoy|ventas hoy/.test(lower)) return CfoIntent.VENTAS_HOY;
    if (/ayer|ventas ayer/.test(lower)) return CfoIntent.VENTAS_AYER;
    if (/stock|inventario|agot|bajo/.test(lower)) return CfoIntent.STOCK_BAJO;
    if (/producto|más vend|top|mejor/.test(lower)) return CfoIntent.PRODUCTO_TOP;
    if (/deu|fiado|crédito|debe/.test(lower)) return CfoIntent.DEUDAS_CLIENTES;
    if (/semana|semanal|últimos 7/.test(lower)) return CfoIntent.RESUMEN_SEMANA;
    return CfoIntent.UNKNOWN;
  }

  private fallbackResponse(intent: CfoIntent, data: unknown): string {
    if (intent === CfoIntent.UNKNOWN) {
      return '🤔 No entendí bien tu pregunta. Puedes preguntarme sobre:\n• Ventas de hoy o ayer\n• Stock bajo\n• Productos más vendidos\n• Deudas de clientes\n• Resumen de la semana';
    }
    return `📊 Aquí están los datos que encontré:\n${JSON.stringify(data, null, 2)}`;
  }
}
