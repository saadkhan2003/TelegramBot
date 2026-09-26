import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_BOT_USERNAME: z.string().optional().default('YourStoreBot'),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be a 64-character hex string'),
  JWT_SECRET: z.string().min(16).default('development_jwt_secret_min_16_chars'),
  ADMIN_DEFAULT_EMAIL: z.string().email().default('admin@store.local'),
  ADMIN_DEFAULT_PASSWORD: z.string().min(8).default('AdminSecurePass123!'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedConfig: EnvConfig | null = null;

export function getAppConfig(): EnvConfig {
  if (!parsedConfig) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.warn('⚠️ Environment config warnings:', parsed.error.format());
      parsedConfig = {
        NODE_ENV: (process.env.NODE_ENV as any) || 'development',
        PORT: Number(process.env.PORT) || 4000,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres_secure_pass@localhost:5432/telegram_store?schema=public',
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'placeholder_bot_token',
        TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'StoreBot',
        TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
        TELEGRAM_WEBHOOK_URL: process.env.TELEGRAM_WEBHOOK_URL,
        ENCRYPTION_KEY:
          process.env.ENCRYPTION_KEY ||
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_super_long_key_123',
        ADMIN_DEFAULT_EMAIL: process.env.ADMIN_DEFAULT_EMAIL || 'admin@store.local',
        ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminSecurePass123!',
      };
    } else {
      parsedConfig = parsed.data;
    }
  }
  return parsedConfig;
}
