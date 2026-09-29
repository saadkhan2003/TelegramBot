import { Bot } from 'grammy';
import { prisma } from '@telegram-store/database';
import { HttpsProxyAgent } from 'https-proxy-agent';

interface RunningBot {
  storeId: string;
  storeName: string;
  botToken: string;
  bot: Bot;
  username?: string;
}

export class MultiBotManager {
  private activeBots = new Map<string, RunningBot>();
  private proxyAgent?: HttpsProxyAgent<string>;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    const proxyUrl = process.env.TELEGRAM_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
      this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    }
  }

  /**
   * Start the multi-tenant bot manager
   */
  async start(botHandlerFactory: (bot: Bot, store: any) => void) {
    console.log('🌐 Multi-Bot Fleet Manager initializing...');

    // 1. Initial boot of all configured stores
    await this.syncStores(botHandlerFactory);

    // 2. Periodic sync every 30 seconds to hot-reload new stores added via Admin Web
    this.checkInterval = setInterval(() => {
      this.syncStores(botHandlerFactory).catch((err) => {
        console.error('Error during multi-bot store sync:', err.message);
      });
    }, 30000);
  }

  async syncStores(botHandlerFactory: (bot: Bot, store: any) => void) {
    try {
      const stores = await prisma.store.findMany({
        where: {
          botStatus: 'ACTIVE',
          botToken: { not: null },
        },
      });

      // Default env bot token fallback
      const envToken = process.env.TELEGRAM_BOT_TOKEN;
      if (envToken && envToken !== 'your_telegram_bot_token_here') {
        const hasEnvStore = stores.some((s) => s.botToken === envToken);
        if (!hasEnvStore) {
          // Find or assign default store
          const defaultStore = await prisma.store.findFirst({
            where: { slug: 'delux-store' },
          });
          if (defaultStore) {
            stores.push({
              ...defaultStore,
              botToken: envToken,
            });
          } else {
            stores.push({
              id: '0cd40b08-3907-4be1-8458-409e9cee21f2',
              name: 'Delux Store',
              slug: 'delux-store',
              botToken: envToken,
              botStatus: 'ACTIVE',
            } as any);
          }
        }
      }

      for (const store of stores) {
        if (!store.botToken) continue;

        const currentRunning = this.activeBots.get(store.id);

        // If already running with same token, continue
        if (currentRunning && currentRunning.botToken === store.botToken) {
          continue;
        }

        // If token changed, stop previous instance
        if (currentRunning) {
          try {
            await currentRunning.bot.stop();
          } catch {
            // ignore
          }
          this.activeBots.delete(store.id);
        }

        // Start new bot runner for this tenant
        try {
          const bot = new Bot(store.botToken, {
            client: {
              baseFetchConfig: this.proxyAgent ? { agent: this.proxyAgent } : undefined,
            },
          });

          // Attach handlers with this store's scope
          botHandlerFactory(bot, store);

          // Start polling
          bot.start({
            onStart: (info) => {
              console.log(
                `🤖 [Tenant: ${store.name}] Bot started as @${info.username} (Store ID: ${store.id.slice(0, 8)})`,
              );
              // Auto-sync slash commands so Telegram displays autocomplete menu
              bot.api
                .setMyCommands([
                  { command: 'start', description: '🏠 Open main menu & welcome' },
                  { command: 'menu', description: '📋 Main navigation menu' },
                  { command: 'shop', description: '🛍️ Browse products & categories' },
                  { command: 'wallet', description: '💳 Check balance & deposit funds' },
                  { command: 'orders', description: '📦 View order history & keys' },
                  { command: 'profile', description: '👤 View account & statistics' },
                  { command: 'referral', description: '🎁 Affiliate program & invite link' },
                  { command: 'support', description: '💬 Help & customer support' },
                  { command: 'language', description: '🌐 Change language preference' },
                  { command: 'cancel', description: '❌ Cancel current form or action' },
                ])
                .catch((err) => {
                  console.warn(`Could not set commands for @${info.username}:`, err.message);
                });

              // Update username in database if needed
              if (store.botUsername !== info.username) {
                prisma.store
                  .update({
                    where: { id: store.id },
                    data: { botUsername: info.username },
                  })
                  .catch(() => {});
              }
            },
          });

          this.activeBots.set(store.id, {
            storeId: store.id,
            storeName: store.name,
            botToken: store.botToken,
            bot,
          });
        } catch (err: any) {
          console.error(
            `❌ Failed to start bot for tenant "${store.name}" (${store.id}):`,
            err.message,
          );
        }
      }
    } catch (err: any) {
      console.error('Failed to query stores for multi-bot fleet:', err.message);
    }
  }

  async stopAll() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    for (const [storeId, running] of this.activeBots.entries()) {
      try {
        await running.bot.stop();
        console.log(`⏹️ Stopped bot for tenant ${running.storeName}`);
      } catch {
        // ignore
      }
    }
    this.activeBots.clear();
  }
}
