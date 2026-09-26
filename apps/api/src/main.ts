import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// Global JSON serialization fix for Prisma BigInt fields (telegramUserId)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  const adminUrls = process.env.ADMIN_WEB_URL
    ? process.env.ADMIN_WEB_URL.split(',').map((u) => u.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || adminUrls.includes('*') || adminUrls.includes(origin) || origin.includes('localhost') || origin.includes('178.105.157.51') || origin.includes('.sslip.io')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Telegram Store API running on port ${port} (prefix: /api/v1)`);
}

bootstrap();
