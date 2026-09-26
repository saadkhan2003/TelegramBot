import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TelegramNotifyService {
  private readonly logger = new Logger(TelegramNotifyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a direct message to a customer's Telegram account
   */
  async sendMessage(params: {
    telegramUserId: string | bigint | number;
    text: string;
    parseMode?: 'Markdown' | 'HTML';
    replyMarkup?: any;
    storeId?: string;
  }): Promise<boolean> {
    try {
      const tgId = params.telegramUserId.toString();
      if (!tgId) return false;

      // Determine bot token: from store or default env
      let botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (params.storeId) {
        const store = await this.prisma.store.findUnique({
          where: { id: params.storeId },
          select: { botToken: true },
        });
        if (store?.botToken) {
          botToken = store.botToken;
        }
      }

      if (!botToken || botToken === 'your_telegram_bot_token_here') {
        this.logger.warn(`Cannot send Telegram notification: No valid bot token configured.`);
        return false;
      }

      const payload: any = {
        chat_id: tgId,
        text: params.text,
        parse_mode: params.parseMode || 'Markdown',
      };

      if (params.replyMarkup) {
        payload.reply_markup = params.replyMarkup;
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.ok) {
        this.logger.warn(`Telegram sendMessage to ${tgId} failed: ${result.description}`);
        return false;
      }

      this.logger.log(`✓ Telegram notification successfully delivered to user ${tgId}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending Telegram notification: ${err.message}`);
      return false;
    }
  }
}
