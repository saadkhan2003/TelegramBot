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

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token_here') {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN is not configured in .env yet.');
}

export const bot = new Bot(BOT_TOKEN || 'dummy_token');
const verifier = new BlockchainPaymentVerifier();

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

  const welcomeText = t('welcome.title', user.preferredLanguage, {
    storeName: 'Apex Digital Store',
  });

  await ctx.reply(welcomeText, {
    reply_markup: buildMainMenu(user.preferredLanguage),
  });
});

// MAIN MENU NAVIGATION
bot.callbackQuery('nav_main', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;
  userStates.delete(user.telegramUserId);

  await ctx.editMessageText(
    t('welcome.title', user.preferredLanguage, { storeName: 'Apex Digital Store' }),
    {
      reply_markup: buildMainMenu(user.preferredLanguage),
    },
  );
  await ctx.answerCallbackQuery();
});

// BUY / CATALOG
bot.callbackQuery('nav_buy', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const categories = await prisma.category.findMany({
    where: { status: CategoryStatus.ACTIVE },
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
    where: { categoryId, status: ProductStatus.ACTIVE },
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

        // Lock inventory rows
        const availableItems = await tx.$queryRaw<{ id: string; encrypted_payload: string }[]>`
          SELECT id, encrypted_payload 
          FROM inventory_items 
          WHERE product_id = ${product.id}::uuid AND status = 'AVAILABLE'
          LIMIT ${quantity}
          FOR UPDATE SKIP LOCKED
        `;

        if (availableItems.length < quantity) {
          throw new Error('Item went out of stock during checkout');
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
            status: OrderStatus.FULFILLED,
            walletTransactionId: walletTx.id,
            completedAt: new Date(),
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
          },
        });

        // 3. Mark inventory sold & create deliveries
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

        return { order, product, deliveryList, quantity, totalAmount };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // Format delivery items for customer
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

  const networks = await prisma.paymentNetwork.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const wallet = user.wallet;
  const balance = Number(wallet?.cachedBalance ?? 0).toFixed(2);
  const deposited = Number(wallet?.totalDeposited ?? 0).toFixed(2);
  const spent = Number(wallet?.totalSpent ?? 0).toFixed(2);
  const referrals = Number(wallet?.referralEarnings ?? 0).toFixed(2);

  const text = t('wallet.title', user.preferredLanguage, {
    balance,
    deposited,
    spent,
    referrals,
  });

  const keyboard = new InlineKeyboard();
  networks.forEach((net) => {
    keyboard.text(`💵 ${net.name}`, `deposit_${net.id}`).row();
  });

  keyboard
    .text(t('menu.refresh', user.preferredLanguage), 'nav_wallet')
    .row()
    .text(t('menu.main', user.preferredLanguage), 'nav_main');

  await ctx.editMessageText(text, { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

// DEPOSIT INSTRUCTIONS
bot.callbackQuery(/^deposit_(.+)$/, async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

  const networkId = ctx.match[1]!;
  const network = await prisma.paymentNetwork.findUnique({ where: { id: networkId } });
  if (!network) return;

  // Set conversation state: WAITING_FOR_TXID
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
    t('welcome.title', langCode, { storeName: 'Apex Digital Store' }),
    { reply_markup: buildMainMenu(langCode) },
  );
});

// SUPPORT MENU
bot.callbackQuery('nav_support', async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return;

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
    await ctx.reply('Use the menu buttons below to navigate:', {
      reply_markup: buildMainMenu(user.preferredLanguage),
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

// Run bot in long-polling mode for local development
if (process.env.NODE_ENV !== 'test' && BOT_TOKEN && BOT_TOKEN !== 'your_telegram_bot_token_here') {
  bot.start({
    onStart: (info) => {
      console.log(`🤖 grammY Telegram Bot started as @${info.username}`);
    },
  });
}
