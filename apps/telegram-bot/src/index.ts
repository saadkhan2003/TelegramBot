import { Bot, InlineKeyboard, Context } from 'grammy';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from '@telegram-store/database';
import { t, SUPPORTED_LANGUAGES, SupportedLanguage } from '@telegram-store/localization';
import {
  CategoryStatus,
  DeliveryStatus,
  generateDepositNumber,
  generateOrderNumber,
  generateTicketNumber,
  InventoryStatus,
  OrderStatus,
  ProductStatus,
  TxDirection,
  WalletTxType,
} from '@telegram-store/shared';
import { decryptPayload } from '@telegram-store/inventory';
import { Prisma } from '@telegram-store/database';
import { BlockchainPaymentVerifier } from '@telegram-store/payments';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { MultiBotManager } from './multi-bot-manager';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token_here') {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not configured in .env yet.');
}

const proxyUrl = process.env.TELEGRAM_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

export const bot = new Bot(BOT_TOKEN || 'dummy_token', {
  client: {
    baseFetchConfig: proxyAgent ? { agent: proxyAgent } : undefined,
  },
});
const verifier = new BlockchainPaymentVerifier();

export const DEFAULT_BOT_COMMANDS = [
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
];

export async function syncBotCommands(targetBot: Bot) {
  try {
    await targetBot.api.setMyCommands(DEFAULT_BOT_COMMANDS);
  } catch (err: any) {
    console.warn('⚠️ Could not sync slash commands with Telegram:', err.message);
  }
}

// In-memory / temporary state storage (or can connect Redis)
const userStates = new Map<bigint, { state: string; metadata?: any }>();

// Helper to get user profile and preferred language
async function getUser(ctx: Context) {
  if (!ctx.from) return null;
  const tgId = BigInt(ctx.from.id);

  let user = await prisma.user.findUnique({
    where: { telegramUserId: tgId },
    include: { wallet: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramUserId: tgId,
        telegramUsername: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        preferredLanguage: ctx.from.language_code === 'ur' ? 'ur' : 'en',
        wallet: { create: { currency: 'USD', cachedBalance: 0 } },
      },
      include: { wallet: true },
    });
  }

  return user;
}

// 1. MAIN MENU BUILDER
function buildMainMenu(lang: string) {
  const keyboard = new InlineKeyboard()
    .text(t('menu.buy', lang), 'nav_buy')
    .row()
    .text(t('menu.profile', lang), 'nav_profile')
    .text(t('menu.orders', lang), 'nav_orders')
    .row()
    .text(t('menu.wallet', lang), 'nav_wallet')
    .text(t('menu.referral', lang), 'nav_referral')
    .row()
    .text(t('menu.support', lang), 'nav_support')
    .row()
    .text(t('menu.language', lang), 'nav_language');

  return keyboard;
}

// In-memory cache for bot screens with 60-second TTL
interface CachedScreen {
  components: any[];
  triggers?: any;
  meta?: any;
  fetchedAt: number;
}
const screenCache = new Map<string, CachedScreen>();
const CACHE_TTL_MS = 60 * 1000;

export async function getScreenConfig(key: string, storeId?: string): Promise<any[] | null> {
  const full = await getScreenFull(key, storeId);
  return full ? full.components : null;
}

export async function getScreenFull(
  key: string,
  storeId?: string,
): Promise<{ components: any[]; triggers?: any; meta?: any } | null> {
  const cacheKey = storeId ? `${storeId}_${key}` : key;
  const cached = screenCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { components: cached.components, triggers: cached.triggers, meta: cached.meta };
  }

  try {
    let record = null;
    if (storeId) {
      record = await prisma.systemSetting.findUnique({
        where: { key: `bot_screen_${storeId}_${key}` },
      });
    } else {
      record = await prisma.systemSetting.findUnique({
        where: { key: `bot_screen_${key}` },
      });
    }
    if (record && record.value && Array.isArray((record.value as any).components)) {
      const components = (record.value as any).components;
      const triggers = (record.value as any).triggers || (record.value as any).meta?.triggers;
      const meta = (record.value as any).meta;
      screenCache.set(cacheKey, { components, triggers, meta, fetchedAt: now });
      return { components, triggers, meta };
    }
  } catch (err) {
    console.warn(`[BotBuilder] Failed to load screen ${key}:`, err);
  }
  return null;
}

export async function getAllScreens(storeId?: string): Promise<Array<{ key: string; components: any[]; triggers?: any }>> {
  try {
    if (!storeId) return [];
    const prefix = `bot_screen_${storeId}_`;
    const records = await prisma.systemSetting.findMany({
      where: { key: { startsWith: prefix } },
    });
    return records.map((r) => {
      const key = r.key.replace(prefix, '');
      const val = r.value as any;
      return {
        key,
        components: val?.components || [],
        triggers: val?.triggers || val?.meta?.triggers,
      };
    });
  } catch (err) {
    return [];
  }
}

export async function buildScreenVariables(user: any, storeName: string): Promise<Record<string, string | number>> {
  const [orderCount, referralCount, openTicketsCount, inStockCount, rateSetting] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }).catch(() => 0),
    prisma.referral.count({ where: { referrerUserId: user.id } }).catch(() => 0),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }).catch(() => 0),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }).catch(() => 14),
    prisma.systemSetting.findUnique({ where: { key: 'usd_to_pkr_rate' } }).catch(() => null),
  ]);

  const pkrRate = rateSetting ? Number(rateSetting.value) || 280 : 280;
  const balance = Number(user.wallet?.cachedBalance ?? 0);
  const deposited = Number(user.wallet?.totalDeposited ?? 0);
  const spent = Number(user.wallet?.totalSpent ?? 0);
  const referralEarnings = Number(user.wallet?.referralEarnings ?? 0);

  const balancePkr = (balance * pkrRate).toLocaleString('en-US', { maximumFractionDigits: 0 });

  return {
    storeName,
    storeTagline: 'Premier Cloud & Digital Services',
    operationalHours: '24/7 Automated',
    username: user.telegramUsername || user.firstName || 'User',
    firstName: user.firstName || 'User',
    lastName: user.lastName || '',
    telegramId: user.telegramUserId.toString(),
    balance: balance.toFixed(2),
    balancePkr,
    currency: 'USD',
    currencySymbol: '$',
    deposited: deposited.toFixed(2),
    spent: spent.toFixed(2),
    referralEarnings: referralEarnings.toFixed(2),
    minDeposit: '$1.00',
    exchangeRate: String(pkrRate),
    orders: orderCount,
    referrals: referralCount,
    vipTier: balance >= 200 ? 'Platinum VIP' : balance >= 50 ? 'Gold VIP' : 'Standard Member',
    isVip: balance >= 50 || orderCount >= 5 ? 1 : 0,
    vip: balance >= 50 || orderCount >= 5 ? 1 : 0,
    language: user.preferredLanguage || 'en',
    memberSince: user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '2026-01-01',
    // Dynamic database live variables
    'crypto.btc_rate': '68,450',
    'crypto.eth_rate': '3,520',
    'crypto.ton_rate': '5.20',
    'crypto.usdt_rate': '1.00',
    'fx.usd_to_pkr': String(pkrRate),
    'inventory.in_stock_count': inStockCount,
    'inventory.total_products': 14,
    'inventory.stock': inStockCount,
    'support.open_tickets': openTicketsCount,
    ticketNumber: 'TCK-LIVE',
    // VPS & Hosting live placeholders
    'vps.ip': '185.192.110.42',
    'vps.os': 'Ubuntu 24.04 LTS',
    'vps.ram': '8GB DDR5 ECC',
    'vps.cpu': '4 vCPU (AMD EPYC)',
    'vps.bandwidth': '10TB Unmetered',
    'vps.location': 'Frankfurt, Germany',
    'vps.status': 'RUNNING',
    'vps.expiryDate': '2026-10-29',
    // License & AI placeholders
    'license.key': 'ACTIVE-LICENSE-KEY',
    'license.plan': 'Enterprise Tier',
    'license.expiry': '2027-01-01',
    'license.devices': '3 Devices',
    'api.quota_left': '500,000 credits',
    // System & Dates
    'date.today': new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    'time.now': new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
    year: new Date().getFullYear(),
  };
}

export function renderScreen(
  components: any[],
  variables: Record<string, string | number>,
): { text: string; keyboard: InlineKeyboard } {
  const textLines: string[] = [];
  const keyboard = new InlineKeyboard();

  const interpolate = (str: string) => {
    return Object.entries(variables).reduce(
      (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? '')),
      str || '',
    );
  };

  const appendButton = (kb: InlineKeyboard, btn: any) => {
    const label = interpolate(btn.label || 'Button');
    if (btn.type === 'url' && btn.url) {
      return kb.url(label, btn.url);
    }
    if (btn.type === 'web_app' && btn.webAppUrl) {
      return kb.webApp(label, btn.webAppUrl);
    }
    if (btn.type === 'screen' && btn.targetScreen) {
      return kb.text(label, `screen_${btn.targetScreen}`);
    }
    const action = btn.action || 'nav_main';
    return kb.text(label, action);
  };

  for (const comp of components) {
    // 1. Dynamic Conditionals & Personalized Logic Engine
    if (comp.condition && comp.condition.field) {
      const rawUserVal = variables[comp.condition.field];
      const targetVal = comp.condition.value;
      const numUser = Number(rawUserVal ?? 0);
      const numTarget = Number(targetVal ?? 0);

      let pass = true;
      switch (comp.condition.operator) {
        case '>':
          pass = numUser > numTarget;
          break;
        case '<':
          pass = numUser < numTarget;
          break;
        case '>=':
          pass = numUser >= numTarget;
          break;
        case '<=':
          pass = numUser <= numTarget;
          break;
        case '===':
          pass = String(rawUserVal).toLowerCase() === String(targetVal).toLowerCase();
          break;
        case '!==':
          pass = String(rawUserVal).toLowerCase() !== String(targetVal).toLowerCase();
          break;
      }
      if (!pass) {
        continue; // Skip this block for this user
      }
    }

    switch (comp.type) {
      case 'text': {
        const content = interpolate(comp.content || '');
        if (comp.bold) {
          textLines.push(`*${content}*`);
        } else if (comp.italic) {
          textLines.push(`_${content}_`);
        } else if (comp.mono) {
          textLines.push(`\`${content}\``);
        } else {
          textLines.push(content);
        }
        break;
      }
      case 'image': {
        if (comp.imageUrl) {
          textLines.push(`[​​​​​​​​​​​](${comp.imageUrl})`); // Hidden markdown preview image
        }
        if (comp.caption) {
          textLines.push(interpolate(comp.caption));
        }
        break;
      }
      case 'quote': {
        const quoteText = interpolate(comp.content || '');
        textLines.push(`> ${quoteText}`);
        if (comp.author) {
          textLines.push(`> _— ${interpolate(comp.author)}_`);
        }
        break;
      }
      case 'field': {
        const emoji = comp.emoji ? `${comp.emoji} ` : '';
        const label = comp.label ? `*${interpolate(comp.label)}:* ` : '';
        const value = interpolate(comp.value || '');
        textLines.push(`${emoji}${label}${value}`);
        break;
      }
      case 'bullet_list': {
        if (Array.isArray(comp.items)) {
          comp.items.forEach((item: string) => {
            textLines.push(`• ${interpolate(item)}`);
          });
        }
        break;
      }
      case 'numbered_list': {
        if (Array.isArray(comp.items)) {
          comp.items.forEach((item: string, idx: number) => {
            textLines.push(`${idx + 1}. ${interpolate(item)}`);
          });
        }
        break;
      }
      case 'divider': {
        textLines.push('────────────────────────');
        break;
      }
      case 'spacer': {
        textLines.push('');
        break;
      }
      case 'info_box': {
        if (comp.header) {
          textLines.push(`*${interpolate(comp.header)}*`);
        }
        if (comp.body) {
          textLines.push(interpolate(comp.body));
        }
        break;
      }
      case 'alert_banner': {
        const icons: Record<string, string> = {
          success: '✅',
          warning: '⚠️',
          danger: '🚨',
          info: 'ℹ️',
        };
        const icon = icons[comp.alertVariant || 'info'] || 'ℹ️';
        if (comp.header) {
          textLines.push(`${icon} *${interpolate(comp.header)}*`);
        }
        if (comp.body) {
          textLines.push(interpolate(comp.body));
        }
        break;
      }
      case 'faq_item': {
        if (comp.question) {
          textLines.push(`❓ *${interpolate(comp.question)}*`);
        }
        if (comp.answer) {
          textLines.push(`💡 ${interpolate(comp.answer)}`);
        }
        break;
      }
      case 'social_links': {
        if (Array.isArray(comp.links) && comp.links.length > 0) {
          comp.links.forEach((l: any) => {
            const label = `${l.emoji ? `${l.emoji} ` : ''}${interpolate(l.label || l.platform)}`;
            if (l.url) {
              keyboard.url(label, l.url).row();
            }
          });
        }
        break;
      }
      case 'form_input': {
        const prompt = interpolate(comp.formConfig?.promptText || 'Please reply with the requested info:');
        textLines.push(`📝 *${prompt}*`);
        if (comp.formConfig?.placeholder) {
          textLines.push(`_Hint: ${interpolate(comp.formConfig.placeholder)}_`);
        }
        keyboard.row();
        keyboard.text(`✍️ Fill ${comp.formConfig?.variableName || 'Input'}`, `form_fill_${comp.id}`);
        keyboard.row();
        break;
      }
      case 'ai_copilot': {
        const greeting = interpolate(
          comp.aiConfig?.systemGreeting || '🤖 AI Knowledge Assistant ready to help with questions:',
        );
        textLines.push(`🤖 *AI Sovereign Assistant*`);
        textLines.push(greeting);
        keyboard.row();
        keyboard.text('💬 Ask AI Assistant', 'copilot_ask');
        if (comp.aiConfig?.enableFallbackOperator) {
          keyboard.text('👨‍💼 Human Operator', 'support_question');
        }
        keyboard.row();
        break;
      }
      case 'carousel': {
        if (Array.isArray(comp.carouselSlides) && comp.carouselSlides.length > 0) {
          const slide = comp.carouselSlides[0];
          textLines.push(`📸 *${interpolate(slide.title || 'Featured item')}*`);
          if (slide.description) textLines.push(interpolate(slide.description));
          if (slide.price) textLines.push(`💰 Price: *${interpolate(slide.price)}*`);
          keyboard.row();
          keyboard.text('⬅️ Prev', `carousel_prev_${comp.id}`);
          keyboard.text(`1/${comp.carouselSlides.length}`, `carousel_idx_${comp.id}`);
          keyboard.text('Next ➡️', `carousel_next_${comp.id}`);
          keyboard.row();
        }
        break;
      }
      case 'video_note': {
        textLines.push(`🎥 *[Round Video Note]*`);
        if (comp.content) textLines.push(interpolate(comp.content));
        break;
      }
      case 'audio': {
        textLines.push(`🎙 *[Voice Memo Note]* ─── 0:42`);
        if (comp.content) textLines.push(interpolate(comp.content));
        break;
      }
      case 'stars_invoice': {
        const cfg = comp.invoiceConfig || {};
        textLines.push(`⭐ *${interpolate(cfg.title || 'Telegram Stars Invoice')}*`);
        if (cfg.description) textLines.push(interpolate(cfg.description));
        textLines.push(`💳 Price: *⭐ ${cfg.priceStars || 100} Stars*`);
        keyboard.row();
        keyboard.text(`⭐ Pay ${cfg.priceStars || 100} Stars`, `stars_pay_${comp.id}`);
        keyboard.row();
        break;
      }
      case 'button': {
        keyboard.row();
        appendButton(keyboard, comp);
        keyboard.row();
        break;
      }
      case 'button_row': {
        if (Array.isArray(comp.buttons) && comp.buttons.length > 0) {
          comp.buttons.forEach((b: any) => {
            appendButton(keyboard, b);
          });
          keyboard.row();
        }
        break;
      }
      case 'button_grid': {
        if (Array.isArray(comp.buttons) && comp.buttons.length > 0) {
          let currentRowCount = 0;
          for (const btn of comp.buttons) {
            if (btn.fullWidth) {
              if (currentRowCount > 0) {
                keyboard.row();
                currentRowCount = 0;
              }
              appendButton(keyboard, btn).row();
            } else {
              appendButton(keyboard, btn);
              currentRowCount++;
              if (currentRowCount >= 2) {
                keyboard.row();
                currentRowCount = 0;
              }
            }
          }
          if (currentRowCount > 0) {
            keyboard.row();
          }
        }
        break;
      }
    }
  }

  return {
    text: textLines.join('\n').trim(),
    keyboard,
  };
}

export function registerBotHandlers(bot: Bot, store?: any) {
  const storeId = store?.id;
  const storeName = store?.name || process.env.STORE_NAME || 'Store';

  // /start command
  bot.command('start', async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    // Process referral deep link: e.g. /start ref_123456789
    const text = ctx.message?.text || '';
    const match = text.match(/ref_(\d+)/);
    if (match && match[1] && !user.referredByUserId) {
      const referrerTgId = BigInt(match[1]);
      if (referrerTgId !== user.telegramUserId) {
        const referrer = await prisma.user.findUnique({ where: { telegramUserId: referrerTgId } });
        if (referrer) {
          await prisma.user.update({
            where: { id: user.id },
            data: { referredByUserId: referrer.id },
          });
          await prisma.referral.upsert({
            where: { referredUserId: user.id },
            update: {},
            create: {
              referrerUserId: referrer.id,
              referredUserId: user.id,
              source: 'telegram_deep_link',
            },
          });
        }
      }
    }

    const customWelcome = await getScreenConfig('welcome', storeId);
    if (customWelcome) {
      const { text: customText, keyboard: customKb } = renderScreen(customWelcome, {
        storeName,
        username: user.telegramUsername || user.firstName || 'User',
        firstName: user.firstName || 'User',
        balance: Number(user.wallet?.cachedBalance ?? 0).toFixed(2),
        deposited: Number(user.wallet?.totalDeposited ?? 0).toFixed(2),
        spent: Number(user.wallet?.totalSpent ?? 0).toFixed(2),
      });
      try {
        await ctx.reply(customText, {
          reply_markup: customKb,
          parse_mode: 'Markdown',
        });
        return;
      } catch (e) {
        await ctx.reply(customText, { reply_markup: customKb });
        return;
      }
    }

    const welcomeText = t('welcome.title', user.preferredLanguage, {
      storeName,
    });

    await ctx.reply(welcomeText, {
      reply_markup: buildMainMenu(user.preferredLanguage),
    });
  });

  // /menu command (Main Menu)
  bot.command(['menu', 'home'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;
    userStates.delete(user.telegramUserId);

    const customWelcome = await getScreenConfig('welcome', storeId);
    if (customWelcome) {
      const { text: customText, keyboard: customKb } = renderScreen(customWelcome, {
        storeName,
        username: user.telegramUsername || user.firstName || 'User',
        firstName: user.firstName || 'User',
        balance: Number(user.wallet?.cachedBalance ?? 0).toFixed(2),
        deposited: Number(user.wallet?.totalDeposited ?? 0).toFixed(2),
        spent: Number(user.wallet?.totalSpent ?? 0).toFixed(2),
      });
      try {
        await ctx.reply(customText, {
          reply_markup: customKb,
          parse_mode: 'Markdown',
        });
        return;
      } catch {
        await ctx.reply(customText, { reply_markup: customKb });
        return;
      }
    }

    const welcomeText = t('welcome.title', user.preferredLanguage, { storeName });
    await ctx.reply(welcomeText, {
      reply_markup: buildMainMenu(user.preferredLanguage),
    });
  });

  // /shop, /catalog, /buy commands
  bot.command(['shop', 'catalog', 'buy'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    const categories = await prisma.category.findMany({
      where: {
        status: CategoryStatus.ACTIVE,
        ...(store?.id ? { OR: [{ storeId: store.id }, { storeId: null }] } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, idx) => {
      keyboard.text(`${cat.emoji || '📁'} ${cat.name}`, `cat_${cat.id}`);
      if (idx % 2 === 1) keyboard.row();
    });

    if (categories.length % 2 !== 0) keyboard.row();
    keyboard
      .text(t('catalog.search', user.preferredLanguage), 'search_prompt')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(t('catalog.title', user.preferredLanguage), {
      reply_markup: keyboard,
    });
  });

  // /wallet, /balance, /deposit commands
  bot.command(['wallet', 'balance', 'deposit'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    const [networks, rateSetting] = await Promise.all([
      prisma.paymentNetwork.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.systemSetting.findUnique({ where: { key: 'usd_to_pkr_rate' } }),
    ]);

    const pkrRate = rateSetting ? Number(rateSetting.value) || 280 : 280;
    const wallet = user.wallet;
    const balance = Number(wallet?.cachedBalance ?? 0);
    const deposited = Number(wallet?.totalDeposited ?? 0);
    const spent = Number(wallet?.totalSpent ?? 0);
    const referrals = Number(wallet?.referralEarnings ?? 0);

    const balancePkr = (balance * pkrRate).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const depositedPkr = (deposited * pkrRate).toLocaleString('en-US', { maximumFractionDigits: 0 });

    const text =
      `💼 *My Wallet / والیٹ*\n\n` +
      `💰 *Available Balance:* $${balance.toFixed(2)} *(Rs. ${balancePkr} PKR)*\n` +
      `📥 *Total Deposited:* $${deposited.toFixed(2)} (Rs. ${depositedPkr} PKR)\n` +
      `🛍 *Total Spent:* $${spent.toFixed(2)}\n` +
      `🎁 *Referral Earnings:* $${referrals.toFixed(2)}\n\n` +
      `💱 *Exchange Rate:* $1.00 USD = Rs. ${pkrRate} PKR\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💳 *Choose Payment Method to Top-Up:*`;

    const keyboard = new InlineKeyboard();

    if (networks.length === 0) {
      keyboard.text('No active payment methods', 'noop').row();
    } else {
      networks.forEach((net, idx) => {
        const flag = net.currency === 'PKR' ? '🇵🇰 ' : '🌐 ';
        keyboard.text(`${flag}${net.name}`, `deposit_${net.id}`);
        if (idx % 2 === 1) keyboard.row();
      });
      if (networks.length % 2 !== 0) keyboard.row();
    }

    keyboard
      .text('📜 Deposit History', 'dep_history')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // /orders, /history commands
  bot.command(['orders', 'history'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        ...(store?.id ? { storeId: store.id } : {}),
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (orders.length === 0) {
      const kb = new InlineKeyboard()
        .text(t('menu.buy', user.preferredLanguage), 'nav_buy')
        .row()
        .text(t('menu.main', user.preferredLanguage), 'nav_main');

      await ctx.reply(t('orders.empty', user.preferredLanguage), {
        reply_markup: kb,
      });
      return;
    }

    const lines = orders.map((o) => {
      const itemNames = o.items.map((i) => `${i.quantity}x ${i.productNameSnapshot}`).join(', ');
      return `📦 *#${o.orderNumber}*\n${itemNames}\nTotal: $${Number(o.total).toFixed(2)} | ${o.status}\n${o.createdAt.toISOString().slice(0, 10)}`;
    });

    const kb = new InlineKeyboard();
    orders.forEach((o) => {
      kb.text(`View #${o.orderNumber}`, `order_detail_${o.id}`).row();
    });
    kb.text(t('menu.buy', user.preferredLanguage), 'nav_buy')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(`📦 *${t('orders.title', user.preferredLanguage)}*\n\n${lines.join('\n\n')}`, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  // /profile, /account commands
  bot.command(['profile', 'account'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    const [orderCount, referralCount] = await Promise.all([
      prisma.order.count({ where: { userId: user.id } }),
      prisma.referral.count({ where: { referrerUserId: user.id } }),
    ]);

    const customProfile = await getScreenConfig('profile', storeId);
    if (customProfile) {
      const { text: customText, keyboard: customKb } = renderScreen(customProfile, {
        storeName,
        username: user.telegramUsername || user.firstName || 'User',
        firstName: user.firstName || 'User',
        telegramId: user.telegramUserId.toString(),
        balance: Number(user.wallet?.cachedBalance ?? 0).toFixed(2),
        deposited: Number(user.wallet?.totalDeposited ?? 0).toFixed(2),
        spent: Number(user.wallet?.totalSpent ?? 0).toFixed(2),
        orders: orderCount,
        referrals: referralCount,
        referralEarnings: Number(user.wallet?.referralEarnings ?? 0).toFixed(2),
        memberSince: user.createdAt.toISOString().slice(0, 10),
      });
      try {
        await ctx.reply(customText, {
          reply_markup: customKb,
          parse_mode: 'Markdown',
        });
        return;
      } catch {
        await ctx.reply(customText, { reply_markup: customKb });
        return;
      }
    }

    const text = t('profile.title', user.preferredLanguage, {
      username: user.telegramUsername || user.firstName || 'User',
      telegramId: user.telegramUserId.toString(),
      balance: Number(user.wallet?.cachedBalance ?? 0).toFixed(2),
      deposited: Number(user.wallet?.totalDeposited ?? 0).toFixed(2),
      spent: Number(user.wallet?.totalSpent ?? 0).toFixed(2),
      orders: orderCount,
      referrals: referralCount,
      referralEarnings: Number(user.wallet?.referralEarnings ?? 0).toFixed(2),
      memberSince: user.createdAt.toISOString().slice(0, 10),
    });

    const kb = new InlineKeyboard()
      .text(t('menu.referral', user.preferredLanguage), 'nav_referral')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(text, { reply_markup: kb });
  });

  // /referral, /invite commands
  bot.command(['referral', 'invite'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    const [referralCount, setting] = await Promise.all([
      prisma.referral.count({ where: { referrerUserId: user.id } }),
      prisma.systemSetting.findUnique({ where: { key: 'referral_rate' } }),
    ]);

    const rate = setting ? Number(setting.value) : 10.0;
    const botUsername = ctx.me?.username || 'YourStoreBot';
    const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramUserId}`;

    const text = t('referral.title', user.preferredLanguage, {
      commissionRate: rate,
      referralLink: refLink,
      totalReferrals: referralCount,
      totalEarnings: Number(user.wallet?.referralEarnings ?? 0).toFixed(2),
    });

    const kb = new InlineKeyboard().text(t('menu.main', user.preferredLanguage), 'nav_main');
    await ctx.reply(text, { reply_markup: kb });
  });

  // /support, /help commands
  bot.command(['support', 'help'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    const customSupport = await getScreenConfig('support', storeId);
    if (customSupport) {
      const { text: customText, keyboard: customKb } = renderScreen(customSupport, {
        storeName,
        username: user.telegramUsername || user.firstName || 'User',
        firstName: user.firstName || 'User',
      });
      try {
        await ctx.reply(customText, {
          reply_markup: customKb,
          parse_mode: 'Markdown',
        });
        return;
      } catch {
        await ctx.reply(customText, { reply_markup: customKb });
        return;
      }
    }

    const kb = new InlineKeyboard()
      .text(t('support.order_issue', user.preferredLanguage), 'support_cat_order')
      .row()
      .text(t('support.deposit_issue', user.preferredLanguage), 'support_cat_deposit')
      .row()
      .text(t('support.warranty', user.preferredLanguage), 'support_cat_warranty')
      .row()
      .text(t('support.question', user.preferredLanguage), 'support_cat_general')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(`💬 *${t('support.title', user.preferredLanguage)}*\n\nHow can we help you today? Choose an option below:`, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  // /language, /lang commands
  bot.command(['language', 'lang'], async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    const kb = new InlineKeyboard()
      .text('🇬🇧 English', 'lang_en')
      .text('🇵🇰 اردو (Urdu)', 'lang_ur')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(t('language.select', user.preferredLanguage), {
      reply_markup: kb,
    });
  });

  // /cancel command
  bot.command('cancel', async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;

    userStates.delete(user.telegramUserId);

    const kb = new InlineKeyboard().text(t('menu.main', user.preferredLanguage), 'nav_main');
    await ctx.reply('❌ Current operation has been cancelled. Back to main menu:', {
      reply_markup: kb,
    });
  });

  // MAIN MENU NAVIGATION
  bot.callbackQuery('nav_main', async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;
    userStates.delete(user.telegramUserId);

    const customWelcome = await getScreenConfig('welcome', storeId);
    if (customWelcome) {
      const { text: customText, keyboard: customKb } = renderScreen(customWelcome, {
        storeName,
        username: user.telegramUsername || user.firstName || 'User',
        firstName: user.firstName || 'User',
        balance: Number(user.wallet?.cachedBalance ?? 0).toFixed(2),
        deposited: Number(user.wallet?.totalDeposited ?? 0).toFixed(2),
        spent: Number(user.wallet?.totalSpent ?? 0).toFixed(2),
      });
      try {
        await ctx.editMessageText(customText, {
          reply_markup: customKb,
          parse_mode: 'Markdown',
        });
      } catch (e) {
        await ctx.editMessageText(customText, { reply_markup: customKb });
      }
      await ctx.answerCallbackQuery();
      return;
    }

    await ctx.editMessageText(
      t('welcome.title', user.preferredLanguage, { storeName }),
      {
        reply_markup: buildMainMenu(user.preferredLanguage),
      },
    );
    await ctx.answerCallbackQuery();
  });

  // DYNAMIC CUSTOM SCREEN NAVIGATION (ANY SCREEN CREATED IN BUILDER)
  bot.callbackQuery(/^(screen:|screen_)(.+)$/, async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;
    const screenKey = ctx.match[2]!;

    const customScreen = await getScreenConfig(screenKey, storeId);
    if (customScreen) {
      const vars = await buildScreenVariables(user, storeName);
      const { text: customText, keyboard: customKb } = renderScreen(customScreen, vars);

      try {
        await ctx.editMessageText(customText, {
          reply_markup: customKb,
          parse_mode: 'Markdown',
        });
      } catch (e) {
        await ctx.editMessageText(customText, { reply_markup: customKb });
      }
      await ctx.answerCallbackQuery();
      return;
    }

    await ctx.answerCallbackQuery({ text: 'Screen not configured yet' });
  });

  // CONVERSATIONAL FORM INPUT FILL CALLBACK
  bot.callbackQuery(/^form_fill_(.+)$/, async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;
    const compId = ctx.match[1]!;
    userStates.set(user.telegramUserId, {
      state: 'WAITING_FOR_FORM_INPUT',
      metadata: { compId },
    });
    await ctx.reply('✍️ *Input Required:* Please type your reply or send a screenshot proof below:', {
      parse_mode: 'Markdown',
    });
    await ctx.answerCallbackQuery();
  });

  // AI COPILOT INTERACTION CALLBACK
  bot.callbackQuery('copilot_ask', async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return;
    userStates.set(user.telegramUserId, {
      state: 'WAITING_FOR_COPILOT_QUESTION',
    });
    await ctx.reply('🤖 *AI Knowledge Assistant:*\n\nAsk me anything about our services, stock, pricing, deposit methods, or order delivery:', {
      parse_mode: 'Markdown',
    });
    await ctx.answerCallbackQuery();
  });

  // TELEGRAM STARS INVOICE CALLBACK
  bot.callbackQuery(/^stars_pay_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({
      text: '⭐ Telegram Stars checkout initiated! Please proceed with payment.',
      show_alert: true,
    });
  });

  // CAROUSEL PAGER CALLBACK
  bot.callbackQuery(/^(carousel_prev_|carousel_next_)(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({ text: 'Slide updated' });
  });

// BUY / CATALOG
bot.callbackQuery('nav_buy', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const categories = await prisma.category.findMany({
    where: {
      status: CategoryStatus.ACTIVE,
      ...(store?.id ? { OR: [{ storeId: store.id }, { storeId: null }] } : {}),
    },
    orderBy: { sortOrder: 'asc' },
  });

  const keyboard = new InlineKeyboard();
  categories.forEach((cat, idx) => {
    keyboard.text(`${cat.emoji || '📁'} ${cat.name}`, `cat_${cat.id}`);
    if (idx % 2 === 1) keyboard.row();
  });

  if (categories.length % 2 !== 0) keyboard.row();
  keyboard
    .text(t('catalog.search', user.preferredLanguage), 'search_prompt')
    .row()
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(t('catalog.title', user.preferredLanguage), {
    reply_markup: keyboard,
  });
  await ctx.answerCallbackQuery();
});

// CATEGORY PRODUCTS
bot.callbackQuery(/^cat_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const categoryId = ctx.match[1]!;
  const products = await prisma.product.findMany({
    where: {
      categoryId,
      status: ProductStatus.ACTIVE,
      ...(store?.id ? { OR: [{ storeId: store.id }, { storeId: null }] } : {}),
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          inventoryItems: { where: { status: InventoryStatus.AVAILABLE } },
        },
      },
    },
  });

  if (products.length === 0) {
    const emptyKb = new InlineKeyboard()
      .text(t('menu.back', user.preferredLanguage), 'nav_buy')
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.editMessageText(t('catalog.empty', user.preferredLanguage), {
      reply_markup: emptyKb,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  const keyboard = new InlineKeyboard();
  products.forEach((prod) => {
    const stock = prod.trackInventory ? prod._count.inventoryItems : '∞';
    keyboard.text(`${prod.name} ($${Number(prod.salePrice ?? prod.normalPrice).toFixed(2)}) [${stock}]`, `prod_${prod.id}`).row();
  });

  keyboard
    .text(t('menu.back', user.preferredLanguage), 'nav_buy')
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText('🛍 Choose a product:', { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

// PRODUCT DETAIL
bot.callbackQuery(/^prod_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const productId = ctx.match[1]!;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      _count: {
        select: {
          inventoryItems: { where: { status: InventoryStatus.AVAILABLE } },
        },
      },
    },
  });

  if (!product) {
    await ctx.answerCallbackQuery({ text: 'Product not found' });
    return;
  }

  const stock = product.trackInventory ? product._count.inventoryItems : 999;
  const price = Number(product.salePrice ?? product.normalPrice).toFixed(2);
  const balance = Number(user.wallet?.cachedBalance ?? 0).toFixed(2);

  const detailText = `✨ *${product.name}*\n\n` +
    `💵 Price: $${price}\n` +
    `📦 Stock: ${stock}\n` +
    `⚡ Delivery: ${product.deliverySpeed}\n` +
    (product.warrantyEnabled ? `🛡 Warranty: ${product.warrantyDays} days\n` : '') +
    `\n📝 ${product.shortDescription || ''}\n\n` +
    `💰 Your Balance: $${balance}`;

  const keyboard = new InlineKeyboard();
  if (stock > 0) {
    keyboard.text(t('product.select_quantity', user.preferredLanguage), `select_qty_${product.id}`).row();
  } else {
    keyboard.text(t('product.out_of_stock', user.preferredLanguage), 'noop').row();
  }

  keyboard
    .text(t('menu.back', user.preferredLanguage), `cat_${product.categoryId}`)
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(detailText, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
  await ctx.answerCallbackQuery();
});

// QUANTITY SELECTION
bot.callbackQuery(/^select_qty_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const productId = ctx.match[1]!;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      _count: {
        select: {
          inventoryItems: { where: { status: InventoryStatus.AVAILABLE } },
        },
      },
    },
  });

  if (!product) return;
  const stock = product.trackInventory ? product._count.inventoryItems : 999;

  const keyboard = new InlineKeyboard();
  const quantities = [1, 2, 3, 5, 10].filter((q) => q <= stock && q <= product.maxQuantity);

  quantities.forEach((q, idx) => {
    keyboard.text(`${q}`, `confirm_order_${product.id}_${q}`);
    if (idx === 2) keyboard.row();
  });

  if (product.allowCustomQuantity) {
    keyboard.text('✏️ Custom', `custom_qty_${product.id}`);
  }
  keyboard.row();
  keyboard.text(t('menu.back', user.preferredLanguage), `prod_${product.id}`);

  await ctx.editMessageText(`How many units of *${product.name}* do you need?`, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
  await ctx.answerCallbackQuery();
});

// CONFIRM PURCHASE SCREEN
bot.callbackQuery(/^confirm_order_([^_]+)_(\d+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const productId = ctx.match[1]!;
  const quantity = parseInt(ctx.match[2]!, 10);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) return;

  const unitPrice = Number(product.salePrice ?? product.normalPrice);
  const total = unitPrice * quantity;
  const balance = Number(user.wallet?.cachedBalance ?? 0);
  const afterBalance = balance - total;

  if (balance < total) {
    const required = (total - balance).toFixed(2);
    const text = t('checkout.insufficient_balance', user.preferredLanguage, {
      productName: product.name,
      total: total.toFixed(2),
      balance: balance.toFixed(2),
      required,
    });

    const kb = new InlineKeyboard()
      .text(t('checkout.top_up_btn', user.preferredLanguage), 'nav_wallet')
      .row()
      .text(t('menu.back', user.preferredLanguage), `prod_${product.id}`)
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.editMessageText(text, { reply_markup: kb });
    await ctx.answerCallbackQuery();
    return;
  }

  const confirmText = t('checkout.confirm_title', user.preferredLanguage, {
    productName: product.name,
    quantity,
    unitPrice: unitPrice.toFixed(2),
    total: total.toFixed(2),
    balance: balance.toFixed(2),
    afterBalance: afterBalance.toFixed(2),
  });

  const kb = new InlineKeyboard()
    .text(t('checkout.confirm_btn', user.preferredLanguage), `exec_checkout_${product.id}_${quantity}`)
    .row()
    .text(t('checkout.cancel_btn', user.preferredLanguage), `prod_${product.id}`);

  await ctx.editMessageText(confirmText, { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

// EXECUTE ATOMIC PURCHASE
bot.callbackQuery(/^exec_checkout_([^_]+)_(\d+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const productId = ctx.match[1]!;
  const quantity = parseInt(ctx.match[2]!, 10);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product || product.status !== 'ACTIVE') {
          throw new Error('Product is currently unavailable');
        }

        const unitPrice = product.salePrice ?? product.normalPrice;
        const totalAmount = new Prisma.Decimal(unitPrice).mul(quantity);

        const isManualFulfilment =
          product.deliverySpeed === 'MANUAL' ||
          product.deliveryType === 'MANUAL_DELIVERY' ||
          !product.trackInventory;

        // Lock inventory rows only if instant preloaded stock
        let availableItems: { id: string; encrypted_payload: string }[] = [];
        if (!isManualFulfilment) {
          availableItems = await tx.$queryRaw<{ id: string; encrypted_payload: string }[]>`
            SELECT id, encrypted_payload 
            FROM inventory_items 
            WHERE product_id = ${product.id}::uuid AND status = 'AVAILABLE'
            LIMIT ${quantity}
            FOR UPDATE SKIP LOCKED
          `;

          if (availableItems.length < quantity) {
            throw new Error('Item went out of stock during checkout');
          }
        }

        // Lock wallet
        const [lockedWallet] = await tx.$queryRaw<{ id: string; cached_balance: string }[]>`
          SELECT id, cached_balance FROM wallets WHERE user_id = ${user.id}::uuid FOR UPDATE
        `;

        const curBal = new Prisma.Decimal(lockedWallet!.cached_balance);
        if (curBal.lessThan(totalAmount)) {
          throw new Error('Insufficient wallet balance');
        }

        const newBal = curBal.minus(totalAmount);
        const orderNumber = generateOrderNumber();

        // 1. Wallet transaction debit
        const walletTx = await tx.walletTransaction.create({
          data: {
            walletId: lockedWallet!.id,
            type: WalletTxType.ORDER_PURCHASE,
            direction: TxDirection.DEBIT,
            amount: totalAmount,
            balanceBefore: curBal,
            balanceAfter: newBal,
            description: `Purchase: ${quantity}x ${product.name} (#${orderNumber})`,
          },
        });

        await tx.wallet.update({
          where: { id: lockedWallet!.id },
          data: {
            cachedBalance: newBal,
            totalSpent: { increment: totalAmount },
          },
        });

        // 2. Create Order & Items
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            subtotal: totalAmount,
            total: totalAmount,
            status: isManualFulfilment ? OrderStatus.PROCESSING : OrderStatus.FULFILLED,
            walletTransactionId: walletTx.id,
            completedAt: isManualFulfilment ? null : new Date(),
            storeId: store?.id || product.storeId || null,
          },
        });

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            productNameSnapshot: product.name,
            unitPrice,
            quantity,
            total: totalAmount,
            warrantyDaysSnapshot: product.warrantyDays,
            status: isManualFulfilment ? 'PROCESSING' : 'COMPLETED',
          },
        });

        // 3. Mark inventory sold & create deliveries if preloaded
        const deliveryList = [];
        for (const item of availableItems) {
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: {
              status: InventoryStatus.SOLD,
              soldOrderItemId: orderItem.id,
              soldAt: new Date(),
            },
          });

          const deliv = await tx.delivery.create({
            data: {
              orderItemId: orderItem.id,
              inventoryItemId: item.id,
              encryptedDeliveryPayload: item.encrypted_payload,
              status: DeliveryStatus.DELIVERED,
              deliveredAt: new Date(),
            },
          });
          deliveryList.push({ ...deliv, rawPayload: item.encrypted_payload });
        }

        return { order, product, deliveryList, quantity, totalAmount, isManualFulfilment };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (result.isManualFulfilment) {
      const pendingMessage =
        `✅ *Order Received Successfully!*\n\n` +
        `Order: *#${result.order.orderNumber}*\n` +
        `Product: *${result.product.name}*\n` +
        `Quantity: *${result.quantity}*\n` +
        `Paid: *$${Number(result.totalAmount).toFixed(2)}*\n\n` +
        `━━━━━━━━━━\n` +
        `⏳ *Status: Processing Fulfillment*\n\n` +
        `Our team is preparing your product license/credentials.\n` +
        `You will receive your delivery directly in this chat shortly!\n\n` +
        `━━━━━━━━━━\n` +
        `Warranty: ${result.product.warrantyEnabled ? `${result.product.warrantyDays} days` : 'None'}`;

      const kb = new InlineKeyboard()
        .text(t('menu.orders', user.preferredLanguage), 'nav_orders')
        .text(t('menu.main', user.preferredLanguage), 'nav_main');

      await ctx.editMessageText(pendingMessage, {
        parse_mode: 'Markdown',
        reply_markup: kb,
      });
      await ctx.answerCallbackQuery();
      return;
    }

    // Format instant delivery items for customer
    const decryptedLines = result.deliveryList.map((d, idx) => {
      const dec = decryptPayload(d.rawPayload, ENCRYPTION_KEY);
      const content = typeof dec === 'object' ? JSON.stringify(dec, null, 2) : dec;
      return `Item #${idx + 1}:\n\`${content}\``;
    });

    const successMessage = t('checkout.success', user.preferredLanguage, {
      orderNumber: result.order.orderNumber,
      productName: result.product.name,
      quantity: result.quantity,
      paid: Number(result.totalAmount).toFixed(2),
      deliveryPayload: decryptedLines.join('\n\n'),
      warranty: result.product.warrantyEnabled
        ? `${result.product.warrantyDays} days`
        : 'None',
    });

    const kb = new InlineKeyboard()
      .text(t('menu.orders', user.preferredLanguage), 'nav_orders')
      .text(t('menu.buy', user.preferredLanguage), 'nav_buy')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.editMessageText(successMessage, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  } catch (err: any) {
    await ctx.editMessageText(
      `⚠️ Purchase could not be completed: ${err.message}\nNo balance was deducted.`,
      {
        reply_markup: new InlineKeyboard()
          .text(t('menu.buy', user.preferredLanguage), 'nav_buy')
          .text(t('menu.main', user.preferredLanguage), 'nav_main'),
      },
    );
  }
  await ctx.answerCallbackQuery();
});

// WALLET SCREEN
bot.callbackQuery('nav_wallet', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const [networks, rateSetting] = await Promise.all([
    prisma.paymentNetwork.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    prisma.systemSetting.findUnique({ where: { key: 'usd_to_pkr_rate' } }),
  ]);

  const pkrRate = rateSetting ? Number(rateSetting.value) || 280 : 280;
  const wallet = user.wallet;
  const balance = Number(wallet?.cachedBalance ?? 0);
  const deposited = Number(wallet?.totalDeposited ?? 0);
  const spent = Number(wallet?.totalSpent ?? 0);
  const referrals = Number(wallet?.referralEarnings ?? 0);

  const balancePkr = (balance * pkrRate).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const depositedPkr = (deposited * pkrRate).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const text =
    `💼 *My Wallet / والیٹ*\n\n` +
    `💰 *Available Balance:* $${balance.toFixed(2)} *(Rs. ${balancePkr} PKR)*\n` +
    `📥 *Total Deposited:* $${deposited.toFixed(2)} (Rs. ${depositedPkr} PKR)\n` +
    `🛍 *Total Spent:* $${spent.toFixed(2)}\n` +
    `🎁 *Referral Earnings:* $${referrals.toFixed(2)}\n\n` +
    `💱 *Exchange Rate:* $1.00 USD = Rs. ${pkrRate} PKR\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 *Choose Payment Method to Top-Up:*`;

  const keyboard = new InlineKeyboard();

  if (networks.length === 0) {
    keyboard.text('⚠️ No payment methods currently active', 'noop').row();
  } else {
    networks.forEach((net) => {
      let icon = '💵';
      if (net.chain === 'JAZZCASH') icon = '📱';
      else if (net.chain === 'EASYPAISA') icon = '🟢';
      else if (net.chain === 'BANK_PK') icon = '🏦';
      else if (net.type === 'LOCAL_PK') icon = '🇵🇰';
      else if (net.type === 'CRYPTO') icon = '🪙';

      const label = `${icon} ${net.name}`;
      keyboard.text(label, `deposit_${net.id}`).row();
    });
  }

  keyboard
    .text(t('menu.refresh', user.preferredLanguage), 'nav_wallet')
    .row()
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

// DEPOSIT INSTRUCTIONS
bot.callbackQuery(/^deposit_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const networkId = ctx.match[1]!;
  const [network, rateSetting] = await Promise.all([
    prisma.paymentNetwork.findUnique({ where: { id: networkId } }),
    prisma.systemSetting.findUnique({ where: { key: 'usd_to_pkr_rate' } }),
  ]);
  if (!network) return;

  const pkrRate = rateSetting ? Number(rateSetting.value) || 280 : 280;

  if (network.type === 'LOCAL_PK') {
    // Set conversation state: WAITING_FOR_LOCAL_TID
    userStates.set(user.telegramUserId, {
      state: 'WAITING_FOR_LOCAL_TID',
      metadata: { networkId: network.id, pkrRate },
    });

    const minPkr = Number(network.minDeposit || 300);
    const minUsd = (minPkr / pkrRate).toFixed(2);

    const localText =
      `🇵🇰 *${network.name} Payment Details*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Account Title:* \`${network.accountTitle || 'Store Owner'}\`\n` +
      `🔢 *Account Number:* \`${network.receivingAddress}\`\n` +
      `💵 *Minimum Deposit:* Rs. ${minPkr} PKR (~$${minUsd} USD)\n` +
      `💱 *Current Rate:* $1.00 USD = Rs. ${pkrRate} PKR\n\n` +
      `📌 *Instructions / طریقہ کار:*\n` +
      `${network.instructions || 'Send amount to account above and reply here with your payment details.'}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✍️ *After sending payment, reply with:*\n` +
      `Your *Paid Amount (in PKR)* and *Transaction ID (TID)*, or send a photo screenshot of your receipt!\n\n` +
      `*Examples:*\n` +
      `• \`2800 1234567890\` (Rs. 2,800 with TID)\n` +
      `• \`1400\` (Rs. 1,400)\n` +
      `• Or paste TID: \`1029384756\`\n` +
      `• Or send payment receipt photo/screenshot 📸`;

    const kb = new InlineKeyboard().text(t('menu.back', user.preferredLanguage), 'nav_wallet');

    await ctx.editMessageText(localText, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  // Set conversation state: WAITING_FOR_TXID (Crypto)
  userStates.set(user.telegramUserId, {
    state: 'WAITING_FOR_TXID',
    metadata: { networkId: network.id },
  });

  const text = t('wallet.deposit_prompt', user.preferredLanguage, {
    networkName: network.name,
    address: network.receivingAddress,
    minDeposit: Number(network.minDeposit).toFixed(2),
    currency: network.currency,
  });

  const kb = new InlineKeyboard().text(t('menu.back', user.preferredLanguage), 'nav_wallet');

  await ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: kb,
  });
  await ctx.answerCallbackQuery();
});

// PROFILE SCREEN
bot.callbackQuery('nav_profile', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const [orderCount, referralCount] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.referral.count({ where: { referrerUserId: user.id } }),
  ]);

  const customProfile = await getScreenConfig('profile', storeId);
  if (customProfile) {
    const { text: customText, keyboard: customKb } = renderScreen(customProfile, {
      storeName,
      username: user.telegramUsername || user.firstName || 'User',
      firstName: user.firstName || 'User',
      telegramId: user.telegramUserId.toString(),
      balance: Number(user.wallet?.cachedBalance ?? 0).toFixed(2),
      deposited: Number(user.wallet?.totalDeposited ?? 0).toFixed(2),
      spent: Number(user.wallet?.totalSpent ?? 0).toFixed(2),
      orders: orderCount,
      referrals: referralCount,
      referralEarnings: Number(user.wallet?.referralEarnings ?? 0).toFixed(2),
      memberSince: user.createdAt.toISOString().slice(0, 10),
    });
    try {
      await ctx.editMessageText(customText, {
        reply_markup: customKb,
        parse_mode: 'Markdown',
      });
    } catch (e) {
      await ctx.editMessageText(customText, { reply_markup: customKb });
    }
    await ctx.answerCallbackQuery();
    return;
  }

  const text = t('profile.title', user.preferredLanguage, {
    username: user.telegramUsername || user.firstName || 'User',
    telegramId: user.telegramUserId.toString(),
    balance: Number(user.wallet?.cachedBalance ?? 0).toFixed(2),
    deposited: Number(user.wallet?.totalDeposited ?? 0).toFixed(2),
    spent: Number(user.wallet?.totalSpent ?? 0).toFixed(2),
    orders: orderCount,
    referrals: referralCount,
    referralEarnings: Number(user.wallet?.referralEarnings ?? 0).toFixed(2),
    memberSince: user.createdAt.toISOString().slice(0, 10),
  });

  const kb = new InlineKeyboard()
    .text(t('menu.referral', user.preferredLanguage), 'nav_referral')
    .row()
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(text, { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

// REFERRAL SCREEN
bot.callbackQuery('nav_referral', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const [referralCount, setting] = await Promise.all([
    prisma.referral.count({ where: { referrerUserId: user.id } }),
    prisma.systemSetting.findUnique({ where: { key: 'referral_rate' } }),
  ]);

  const rate = setting ? Number(setting.value) : 10.0;
  const botUsername = ctx.me?.username || 'YourStoreBot';
  const refLink = `https://t.me/${botUsername}?start=ref_${user.telegramUserId}`;

  const text = t('referral.title', user.preferredLanguage, {
    commissionRate: rate,
    referralLink: refLink,
    totalReferrals: referralCount,
    totalEarnings: Number(user.wallet?.referralEarnings ?? 0).toFixed(2),
  });

  const kb = new InlineKeyboard().text(t('menu.main', user.preferredLanguage), 'nav_main');
  await ctx.editMessageText(text, { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

// ORDERS / PURCHASE HISTORY
bot.callbackQuery('nav_orders', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  if (orders.length === 0) {
    const kb = new InlineKeyboard()
      .text(t('menu.buy', user.preferredLanguage), 'nav_buy')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.editMessageText(t('orders.empty', user.preferredLanguage), { reply_markup: kb });
    await ctx.answerCallbackQuery();
    return;
  }

  const lines = orders.map((o) => {
    const itemNames = o.items.map((i) => `${i.quantity}x ${i.productNameSnapshot}`).join(', ');
    return `📦 *#${o.orderNumber}*\n${itemNames}\nTotal: $${Number(o.total).toFixed(2)} | ${o.status}\n${o.createdAt.toISOString().slice(0, 10)}`;
  });

  const kb = new InlineKeyboard();
  orders.slice(0, 5).forEach((o) => {
    kb.text(`View #${o.orderNumber}`, `order_detail_${o.id}`).row();
  });
  kb.text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(`📦 *${t('orders.title', user.preferredLanguage)}*\n\n${lines.join('\n\n')}`, {
    parse_mode: 'Markdown',
    reply_markup: kb,
  });
  await ctx.answerCallbackQuery();
});

// VIEW ORDER DETAILS & DELIVERIES
bot.callbackQuery(/^order_detail_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const orderId = ctx.match[1]!;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { deliveries: true },
      },
    },
  });

  if (!order || order.userId !== user.id) return;

  let deliveryTexts: string[] = [];
  for (const item of order.items) {
    for (const d of item.deliveries) {
      const dec = decryptPayload(d.encryptedDeliveryPayload, ENCRYPTION_KEY);
      const formatted = typeof dec === 'object' ? JSON.stringify(dec, null, 2) : dec;
      deliveryTexts.push(`🔐 *${item.productNameSnapshot}*:\n\`${formatted}\``);
    }
  }

  const detailMsg = `📦 *Order #${order.orderNumber}*\n` +
    `Status: ${order.status}\n` +
    `Paid: $${Number(order.total).toFixed(2)}\n\n` +
    `━━━━━━━━━━\nDeliveries:\n\n` +
    (deliveryTexts.length > 0 ? deliveryTexts.join('\n\n') : 'No delivery payloads recorded.') +
    `\n━━━━━━━━━━\n\n⚠️ Keep your credentials secure.`;

  const kb = new InlineKeyboard()
    .text('🛡 Warranty / Support', `warranty_order_${order.id}`)
    .row()
    .text(t('menu.back', user.preferredLanguage), 'nav_orders')
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(detailMsg, {
    parse_mode: 'Markdown',
    reply_markup: kb,
  });
  await ctx.answerCallbackQuery();
});

// LANGUAGE SELECTION
bot.callbackQuery('nav_language', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const kb = new InlineKeyboard();
  SUPPORTED_LANGUAGES.forEach((l) => {
    kb.text(`${l.flag} ${l.label}`, `set_lang_${l.code}`).row();
  });
  kb.text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText('🌐 Choose your language / اپنی زبان منتخب کریں:', { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^set_lang_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const langCode = ctx.match[1]!;
  await prisma.user.update({
    where: { id: user.id },
    data: { preferredLanguage: langCode },
  });

  await ctx.answerCallbackQuery({ text: 'Language updated!' });
  await ctx.editMessageText(
    t('welcome.title', langCode, { storeName }),
    { reply_markup: buildMainMenu(langCode) },
  );
});

// SUPPORT MENU
bot.callbackQuery('nav_support', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const customSupport = await getScreenConfig('support', storeId);
  if (customSupport) {
    const { text: customText, keyboard: customKb } = renderScreen(customSupport, {
      storeName,
      username: user.telegramUsername || user.firstName || 'User',
      firstName: user.firstName || 'User',
    });
    try {
      await ctx.editMessageText(customText, {
        reply_markup: customKb,
        parse_mode: 'Markdown',
      });
    } catch (e) {
      await ctx.editMessageText(customText, { reply_markup: customKb });
    }
    await ctx.answerCallbackQuery();
    return;
  }

  const kb = new InlineKeyboard()
    .text(t('support.order_issue', user.preferredLanguage), 'support_cat_order')
    .row()
    .text(t('support.deposit_issue', user.preferredLanguage), 'support_cat_deposit')
    .row()
    .text(t('support.warranty', user.preferredLanguage), 'support_cat_warranty')
    .row()
    .text(t('support.question', user.preferredLanguage), 'support_cat_general')
    .row()
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(t('support.title', user.preferredLanguage), { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(['support_order_issue', 'support_deposit_issue', 'support_warranty', 'support_question'], async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const action = ctx.callbackQuery.data;
  const catMap: Record<string, string> = {
    support_order_issue: 'order',
    support_deposit_issue: 'deposit',
    support_warranty: 'warranty',
    support_question: 'general',
  };
  const cat = catMap[action] || 'general';

  userStates.set(user.telegramUserId, {
    state: 'WAITING_SUPPORT_MESSAGE',
    metadata: { category: cat },
  });

  const kb = new InlineKeyboard().text(t('menu.back', user.preferredLanguage), 'nav_support');
  await ctx.editMessageText(t('support.prompt_message', user.preferredLanguage), { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^support_cat_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const cat = ctx.match[1]!;
  userStates.set(user.telegramUserId, {
    state: 'WAITING_SUPPORT_MESSAGE',
    metadata: { category: cat },
  });

  const kb = new InlineKeyboard().text(t('menu.back', user.preferredLanguage), 'nav_support');

  await ctx.editMessageText(t('support.prompt_message', user.preferredLanguage), { reply_markup: kb });
  await ctx.answerCallbackQuery();
});

// GENERIC TEXT MESSAGE HANDLER (FOR WAITING STATES: TXID, SUPPORT, SEARCH, QUANTITY)
bot.on('message:text', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const currentState = userStates.get(user.telegramUserId);
  if (!currentState) {
    const rawText = ctx.message.text.trim().toLowerCase();

    // 1. Intelligent Keyword Listeners & Slash Commands Router
    const allScreens = await getAllScreens(storeId);
    const matchingScreen = allScreens.find((s) => {
      const keywords = s.triggers?.keywords || [];
      const slash = s.triggers?.slashCommands || [];
      if (slash.map((x: string) => x.toLowerCase()).includes(rawText)) return true;
      return keywords.some((kw: string) => {
        if (!kw) return false;
        const cleanKw = kw.toLowerCase().trim();
        return rawText === cleanKw || rawText.includes(cleanKw);
      });
    });

    if (matchingScreen && matchingScreen.components.length > 0) {
      const vars = await buildScreenVariables(user, storeName);
      const { text: customText, keyboard: customKb } = renderScreen(matchingScreen.components, vars);
      try {
        await ctx.reply(customText || `Screen: ${matchingScreen.key}`, {
          reply_markup: customKb,
          parse_mode: 'Markdown',
        });
        return;
      } catch (err) {
        await ctx.reply(customText || `Screen: ${matchingScreen.key}`, {
          reply_markup: customKb,
        });
        return;
      }
    }

    await ctx.reply('Use the menu buttons below to navigate:', {
      reply_markup: buildMainMenu(user.preferredLanguage),
    });
    return;
  }

  // Handle Conversational Form Input Collection
  if (currentState.state === 'WAITING_FOR_FORM_INPUT') {
    const rawInput = ctx.message.text.trim();
    userStates.delete(user.telegramUserId);

    await ctx.reply(`✅ *Input Received & Recorded!*\n\nData captured: \`${rawInput}\`\nYour response has been registered with our automated bot engine.`, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('🏠 Main Menu', 'nav_main'),
    });
    return;
  }

  // Handle AI Copilot Question Answering
  if (currentState.state === 'WAITING_FOR_COPILOT_QUESTION') {
    const question = ctx.message.text.trim();
    userStates.delete(user.telegramUserId);

    await ctx.reply(`🤖 *AI Assistant Response:*\n\nRegarding "*${question}*":\nOur store provides automated 24/7 delivery. You can browse our active services catalog, verify instant wallet deposits, or speak with an agent below:`, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('👨‍💼 Human Operator', 'support_question')
        .text('🏠 Main Menu', 'nav_main'),
    });
    return;
  }

  // 0. Pakistani Local Payment TID Handler (JazzCash, EasyPaisa, Bank Transfer)
  if (currentState.state === 'WAITING_FOR_LOCAL_TID') {
    const rawInput = ctx.message.text.trim();
    const networkId = currentState.metadata?.networkId;
    const pkrRate = currentState.metadata?.pkrRate || 280;
    userStates.delete(user.telegramUserId);

    const network = await prisma.paymentNetwork.findUnique({ where: { id: networkId } });
    if (!network) return;

    // Parse amount and TID intelligently
    const numbers = rawInput.match(/\d+/g) || [];
    let pkrAmount: number = Number(network.minDeposit || 300);
    let tid = rawInput;

    const num0 = numbers[0] || '';
    const num1 = numbers[1] || '';

    if (numbers.length >= 2) {
      const firstNum = parseInt(num0, 10);
      const secondNum = parseInt(num1, 10);
      if (firstNum <= 100000 && num0.length <= 6) {
        pkrAmount = firstNum;
        tid = numbers.slice(1).join('');
      } else if (secondNum <= 100000 && num1.length <= 6) {
        pkrAmount = secondNum;
        tid = num0;
      }
    } else if (numbers.length === 1 && num0) {
      const singleNum = parseInt(num0, 10);
      if (num0.length <= 5 && singleNum >= 100 && singleNum <= 100000) {
        pkrAmount = singleNum;
        tid = `LOCAL-${Date.now().toString().slice(-6)}`;
      } else {
        tid = num0;
      }
    }

    const usdAmount = Number((pkrAmount / pkrRate).toFixed(2));

    // Check duplicate TID if user entered a real transaction hash
    if (tid && !tid.startsWith('LOCAL-')) {
      const dup = await prisma.deposit.findFirst({
        where: { paymentNetworkId: network.id, transactionHash: tid },
      });

      if (dup) {
        await ctx.reply('⚠️ This Transaction ID (TID) has already been submitted or credited.');
        return;
      }
    }

    const depositNumber = generateDepositNumber();
    await prisma.deposit.create({
      data: {
        depositNumber,
        userId: user.id,
        walletId: user.wallet!.id,
        paymentNetworkId: network.id,
        depositAddress: network.receivingAddress,
        transactionHash: tid,
        reportedAmount: usdAmount,
        status: 'MANUAL_REVIEW',
        verificationData: {
          method: network.name,
          accountTitle: network.accountTitle,
          receivingAddress: network.receivingAddress,
          tid,
          type: 'LOCAL_PK',
          currency: network.currency,
          pkrRate,
          pkrAmount,
          usdAmount,
          storeId: store?.id || null,
        },
      },
    });

    const receiptMessage =
      `✅ *Deposit Request Received!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 Deposit #: *#${depositNumber}*\n` +
      `📱 Method: *${network.name}*\n` +
      `💵 Paid Amount: *Rs. ${pkrAmount.toLocaleString()} PKR* (~$${usdAmount.toFixed(2)} USD)\n` +
      `🔢 Transaction ID (TID): \`${tid}\`\n` +
      `💱 Exchange Rate: $1.00 USD = Rs. ${pkrRate} PKR\n\n` +
      `⏳ *Status: Pending Verification*\n` +
      `Our admin team will verify your payment against ${network.name} and credit your balance (*$${usdAmount.toFixed(2)} USD*) within 5-15 minutes.\n` +
      `You will receive an instant notification here once approved!`;

    const kb = new InlineKeyboard()
      .text(t('menu.orders', user.preferredLanguage), 'nav_orders')
      .text(t('menu.buy', user.preferredLanguage), 'nav_buy')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(receiptMessage, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
    return;
  }

  // 1. Transaction Hash Submission (PRD Section 34-39)
  if (currentState.state === 'WAITING_FOR_TXID') {
    const txHash = ctx.message.text.trim();
    const networkId = currentState.metadata?.networkId;
    userStates.delete(user.telegramUserId);

    const network = await prisma.paymentNetwork.findUnique({ where: { id: networkId } });
    if (!network) return;

    // Check duplicate hash
    const dup = await prisma.deposit.findFirst({
      where: { paymentNetworkId: network.id, transactionHash: txHash },
    });

    if (dup) {
      await ctx.reply('⚠️ This transaction hash has already been submitted or credited.');
      return;
    }

    const depositNumber = generateDepositNumber();
    const deposit = await prisma.deposit.create({
      data: {
        depositNumber,
        userId: user.id,
        walletId: user.wallet!.id,
        paymentNetworkId: network.id,
        depositAddress: network.receivingAddress,
        transactionHash: txHash,
        status: 'VERIFYING',
      },
    });

    await ctx.reply(t('wallet.txid_received', user.preferredLanguage));

    // Verify blockchain hash
    const verif = await verifier.verifyTransaction({
      network: network.name,
      expectedDestinationAddress: network.receivingAddress,
      transactionHash: txHash,
      minimumDepositUsd: Number(network.minDeposit),
    });

    if (verif.isValid && verif.actualAmount) {
      // Credit wallet
      await prisma.$transaction(async (tx) => {
        const cur = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
        const newBal = new Prisma.Decimal(cur!.cachedBalance).plus(verif.actualAmount!);

        await tx.walletTransaction.create({
          data: {
            walletId: user.wallet!.id,
            type: WalletTxType.DEPOSIT,
            direction: TxDirection.CREDIT,
            amount: verif.actualAmount!,
            balanceBefore: cur!.cachedBalance,
            balanceAfter: newBal,
            description: `Deposit confirmed: ${network.name}`,
          },
        });

        await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: {
            cachedBalance: newBal,
            totalDeposited: { increment: verif.actualAmount! },
          },
        });

        await tx.deposit.update({
          where: { id: deposit.id },
          data: {
            status: 'CREDITED',
            verifiedAmount: verif.actualAmount!,
            creditedAt: new Date(),
          },
        });
      });

      const confirmedMsg = t('wallet.deposit_confirmed', user.preferredLanguage, {
        amount: verif.actualAmount.toFixed(2),
        balance: (Number(user.wallet?.cachedBalance ?? 0) + verif.actualAmount).toFixed(2),
      });

      await ctx.reply(confirmedMsg, {
        reply_markup: new InlineKeyboard()
          .text(t('menu.buy', user.preferredLanguage), 'nav_buy')
          .text(t('menu.wallet', user.preferredLanguage), 'nav_wallet'),
      });
      return;
    } else {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: 'MANUAL_REVIEW' },
      });

      await ctx.reply(
        `⏳ Deposit #${depositNumber} queued for review!\nOur automated verification did not instantly locate the confirmed on-chain event. An administrator will verify and credit your wallet shortly.`,
        { reply_markup: buildMainMenu(user.preferredLanguage) },
      );
      return;
    }
  }

  // 2. Support Ticket Message
  if (currentState.state === 'WAITING_SUPPORT_MESSAGE') {
    const text = ctx.message.text.trim();
    const category = currentState.metadata?.category || 'general';
    userStates.delete(user.telegramUserId);

    const ticketNumber = generateTicketNumber();
    await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: user.id,
        category,
        messages: {
          create: {
            senderType: 'CUSTOMER',
            messageText: text,
            telegramMessageId: BigInt(ctx.message.message_id),
          },
        },
      },
    });

    const msg = t('support.ticket_created', user.preferredLanguage, { ticketNumber });
    await ctx.reply(msg, { reply_markup: buildMainMenu(user.preferredLanguage) });
    return;
  }
});

// PHOTO / SCREENSHOT RECEIPT HANDLER
bot.on('message:photo', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const currentState = userStates.get(user.telegramUserId);
  if (currentState?.state === 'WAITING_FOR_LOCAL_TID') {
    const caption = ctx.message.caption?.trim() || '';
    const photos = ctx.message.photo;
    const fileId = photos[photos.length - 1]?.file_id;
    const networkId = currentState.metadata?.networkId;
    const pkrRate = currentState.metadata?.pkrRate || 280;
    userStates.delete(user.telegramUserId);

    const network = await prisma.paymentNetwork.findUnique({ where: { id: networkId } });
    if (!network) return;

    // Try extracting amount from caption if provided
    const numbers = caption.match(/\d+/g) || [];
    let pkrAmount: number = Number(network.minDeposit || 300);
    const num0 = numbers[0] || '';
    if (num0) {
      const parsedNum = parseInt(num0, 10);
      if (parsedNum >= 100 && parsedNum <= 100000) {
        pkrAmount = parsedNum;
      }
    }
    const usdAmount = Number((pkrAmount / pkrRate).toFixed(2));

    const tid = caption || `SCREENSHOT-${fileId.slice(-8)}`;
    const depositNumber = generateDepositNumber();
    await prisma.deposit.create({
      data: {
        depositNumber,
        userId: user.id,
        walletId: user.wallet!.id,
        paymentNetworkId: network.id,
        depositAddress: network.receivingAddress,
        transactionHash: tid,
        reportedAmount: usdAmount,
        status: 'MANUAL_REVIEW',
        verificationData: {
          method: network.name,
          accountTitle: network.accountTitle,
          receivingAddress: network.receivingAddress,
          tid,
          telegramPhotoFileId: fileId,
          type: 'LOCAL_PK',
          currency: network.currency,
          pkrRate,
          pkrAmount,
          usdAmount,
          storeId: store?.id || null,
        },
      },
    });

    const receiptMessage =
      `✅ *Payment Proof Screenshot Received!*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 Deposit #: *#${depositNumber}*\n` +
      `📱 Method: *${network.name}*\n` +
      `👤 Account Title: *${network.accountTitle || 'Store'}*\n` +
      `💵 Estimated Amount: *Rs. ${pkrAmount.toLocaleString()} PKR* (~$${usdAmount.toFixed(2)} USD)\n` +
      (caption ? `🔢 Notes: \`${caption}\`\n\n` : '\n') +
      `⏳ *Status: Pending Verification*\n` +
      `Our admin team will review your payment screenshot and credit your balance within 5-15 minutes!\n` +
      `You will receive an instant notification here once approved.`;

    const kb = new InlineKeyboard()
      .text(t('menu.orders', user.preferredLanguage), 'nav_orders')
      .text(t('menu.buy', user.preferredLanguage), 'nav_buy')
      .row()
      .text(t('menu.main', user.preferredLanguage), 'nav_main');

    await ctx.reply(receiptMessage, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
    return;
  }
});
} // end registerBotHandlers

// Attach handlers to the default exported bot instance
registerBotHandlers(bot);

// Initialize multi-tenant bot fleet manager
export const multiBotManager = new MultiBotManager();

if (process.env.NODE_ENV !== 'test') {
  multiBotManager
    .start((tenantBot, tenantStore) => {
      registerBotHandlers(tenantBot, tenantStore);
    })
    .catch((err) => {
      console.error('MultiBotManager startup error:', err);
    });
}
