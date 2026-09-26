import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from '@telegram-store/database';
import { DepositStatus, InventoryStatus } from '@telegram-store/shared';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export const defaultQueue = new Queue('store-jobs', { connection: redisConnection });

console.log('⚡ Starting BullMQ Background Worker...');

const worker = new Worker(
  'store-jobs',
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name} (ID: ${job.id})`);

    switch (job.name) {
      case 'CHECK_LOW_STOCK': {
        const products = await prisma.product.findMany({
          where: { trackInventory: true, status: 'ACTIVE' },
          include: {
            _count: {
              select: { inventoryItems: { where: { status: InventoryStatus.AVAILABLE } } },
            },
          },
        });

        const lowStock = products.filter(
          (p) => p.lowStockThreshold && p._count.inventoryItems <= p.lowStockThreshold,
        );

        console.log(`[Worker] Low stock scan complete. ${lowStock.length} items flagged.`);
        return { flaggedCount: lowStock.length };
      }

      case 'RELEASE_EXPIRED_RESERVATIONS': {
        const now = new Date();
        const expired = await prisma.inventoryItem.updateMany({
          where: {
            status: InventoryStatus.RESERVED,
            reservationExpiresAt: { lte: now },
          },
          data: {
            status: InventoryStatus.AVAILABLE,
            reservedOrderId: null,
            reservedAt: null,
            reservationExpiresAt: null,
          },
        });
        console.log(`[Worker] Released ${expired.count} expired inventory reservations.`);
        return { released: expired.count };
      }

      default:
        console.warn(`[Worker] Unknown job name: ${job.name}`);
        return null;
    }
  },
  { connection: redisConnection },
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});
