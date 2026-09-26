import { Bot } from 'grammy';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN!;
console.log('Testing bot token connection with Telegram servers...');

const bot = new Bot(token);

bot.api.getMe().then((me) => {
  console.log('🎉 Telegram API Connection Successful!');
  console.log(`Bot ID: ${me.id}`);
  console.log(`Bot Name: ${me.first_name}`);
  console.log(`Bot Username: @${me.username}`);
  process.exit(0);
}).catch((err) => {
  console.error('❌ Failed to connect to Telegram:', err);
  process.exit(1);
});
