import { PrismaClient, CategoryStatus, ProductStatus, DeliveryType, DeliverySpeed } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { encryptPayload } from '@telegram-store/inventory';
import { DEFAULT_TRANSLATIONS, SupportedLanguage } from '@telegram-store/localization';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Roles & Permissions
  const permissionsList = [
    { slug: 'products.view', description: 'View products and categories' },
    { slug: 'products.edit', description: 'Create and update products and categories' },
    { slug: 'inventory.view', description: 'View stock counts and status' },
    { slug: 'inventory.credentials_view', description: 'Decrypt and view sensitive credentials' },
    { slug: 'inventory.create', description: 'Upload and create inventory items' },
    { slug: 'orders.view', description: 'View customer orders' },
    { slug: 'orders.refund', description: 'Refund orders' },
    { slug: 'wallets.view', description: 'View wallet ledger' },
    { slug: 'wallets.adjust', description: 'Perform manual wallet adjustments' },
    { slug: 'deposits.view', description: 'View customer deposit records' },
    { slug: 'deposits.override', description: 'Manual deposit verification/overrides' },
    { slug: 'support.manage', description: 'Handle support tickets and warranty claims' },
    { slug: 'admins.manage', description: 'Create and manage admin users' },
    { slug: 'settings.manage', description: 'Manage store settings and branding' },
    { slug: 'broadcasts.manage', description: 'Create and send Telegram broadcasts' },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: { description: perm.description },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  const ownerRole = await prisma.role.upsert({
    where: { slug: 'OWNER' },
    update: { name: 'Owner' },
    create: {
      name: 'Owner',
      slug: 'OWNER',
      description: 'Highest administrative role with full access',
    },
  });

  // Assign all permissions to OWNER
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: ownerRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Support Agent role
  const supportRole = await prisma.role.upsert({
    where: { slug: 'SUPPORT_AGENT' },
    update: { name: 'Support Agent' },
    create: {
      name: 'Support Agent',
      slug: 'SUPPORT_AGENT',
      description: 'Customer and ticket support management',
    },
  });

  const supportPermSlugs = ['orders.view', 'support.manage', 'products.view'];
  for (const perm of allPermissions.filter((p) => supportPermSlugs.includes(p.slug))) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: supportRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: supportRole.id,
        permissionId: perm.id,
      },
    });
  }

  // 2. Default Admin User
  const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@store.local';
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminSecurePass123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: defaultEmail },
    update: { passwordHash: hashedPassword },
    create: {
      email: defaultEmail,
      passwordHash: hashedPassword,
    },
  });

  await prisma.adminRole.upsert({
    where: {
      adminId_roleId: {
        adminId: admin.id,
        roleId: ownerRole.id,
      },
    },
    update: {},
    create: {
      adminId: admin.id,
      roleId: ownerRole.id,
    },
  });

  console.log(`👤 Admin created: ${defaultEmail}`);

  // 3. Payment Networks (Pakistani Local + Crypto)
  const networks = [
    {
      name: 'JazzCash (Pakistan)',
      chain: 'JAZZCASH',
      currency: 'PKR',
      symbol: 'PKR',
      type: 'LOCAL_PK',
      accountTitle: 'Delux Store / Saad',
      receivingAddress: '03001234567',
      instructions: '1. Send PKR to JazzCash account above via JazzCash App or *786#.\n2. Choose "Online Purchase" or "Money Transfer".\n3. Reply to this bot with your 11/12-digit Transaction ID (TID) from the SMS.',
      minDeposit: 300,
      confirmationsRequired: 1,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'EasyPaisa (Pakistan)',
      chain: 'EASYPAISA',
      currency: 'PKR',
      symbol: 'PKR',
      type: 'LOCAL_PK',
      accountTitle: 'Delux Store / Saad',
      receivingAddress: '03451234567',
      instructions: '1. Open EasyPaisa app and transfer to account number above.\n2. In payment purpose select "Online Purchase".\n3. Reply to this bot with your 11-digit TRX ID from the payment SMS.',
      minDeposit: 300,
      confirmationsRequired: 1,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Bank Transfer / Raast (Pakistan)',
      chain: 'BANK_PK',
      currency: 'PKR',
      symbol: 'PKR',
      type: 'LOCAL_PK',
      accountTitle: 'Muhammad Saad',
      receivingAddress: 'PK00MEZN0001234567890123 / Raast: 03001234567',
      instructions: '1. Transfer from any Pakistani bank (Meezan, HBL, Nayapay, Sadapay, etc.) using IBAN or Raast ID.\n2. Reply to this bot with your Bank Reference / Transaction ID.',
      minDeposit: 500,
      confirmationsRequired: 1,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'USDT BEP20 (Binance Smart Chain)',
      chain: 'BSC',
      currency: 'USDT',
      symbol: 'USDT',
      type: 'CRYPTO',
      accountTitle: null,
      receivingAddress: '0x71C8fb8613330F8970C43c7B1028711E8857Ea24',
      instructions: 'Send USDT on BSC (BEP20 network). Once sent, submit transaction hash (TXID).',
      minDeposit: 1.0,
      confirmationsRequired: 15,
      isActive: false,
      sortOrder: 10,
    },
    {
      name: 'USDT TRC20 (TRON Network)',
      chain: 'TRON',
      currency: 'USDT',
      symbol: 'USDT',
      type: 'CRYPTO',
      accountTitle: null,
      receivingAddress: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6',
      instructions: 'Send USDT on TRON (TRC20 network). Once sent, submit transaction hash (TXID).',
      minDeposit: 5.0,
      confirmationsRequired: 20,
      isActive: false,
      sortOrder: 11,
    },
    {
      name: 'TON (The Open Network)',
      chain: 'TON',
      currency: 'TON',
      symbol: 'TON',
      type: 'CRYPTO',
      accountTitle: null,
      receivingAddress: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N',
      instructions: 'Send TON coins to address. Submit TXID.',
      minDeposit: 0.5,
      confirmationsRequired: 1,
      isActive: false,
      sortOrder: 12,
    },
  ];

  for (const net of networks) {
    const existing = await prisma.paymentNetwork.findFirst({ where: { chain: net.chain } });
    if (!existing) {
      await prisma.paymentNetwork.create({ data: net });
    } else {
      await prisma.paymentNetwork.update({
        where: { id: existing.id },
        data: {
          type: net.type,
          sortOrder: net.sortOrder,
          accountTitle: existing.accountTitle || net.accountTitle,
          instructions: existing.instructions || net.instructions,
        },
      });
    }
  }

  // 4. Categories & Products
  const aiCategory = await prisma.category.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'AI Tools',
      emoji: '🤖',
      description: 'Cutting-edge AI assistants and subscriptions',
      sortOrder: 1,
    },
  });

  const devCategory = await prisma.category.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Developer Tools',
      emoji: '💻',
      description: 'Code assistants, IDE licenses, and cloud credits',
      sortOrder: 2,
    },
  });

  const geminiProduct = await prisma.product.upsert({
    where: { sku: 'GEMINI-PRO-18M' },
    update: {},
    create: {
      categoryId: aiCategory.id,
      sku: 'GEMINI-PRO-18M',
      name: 'Gemini Pro 18 Months',
      slug: 'gemini-pro-18m',
      shortDescription: 'Official Gemini Pro activation link. Activate on your personal email.',
      fullDescription: 'Includes 2TB Google One cloud storage, Google Gemini Advanced model access, and premium docs integration.',
      normalPrice: 0.8,
      deliveryType: DeliveryType.ACTIVATION_LINK,
      deliverySpeed: DeliverySpeed.INSTANT,
      warrantyEnabled: true,
      warrantyDays: 540,
      minQuantity: 1,
      maxQuantity: 10,
      trackInventory: true,
      lowStockThreshold: 5,
      status: ProductStatus.ACTIVE,
      featured: true,
      sortOrder: 1,
    },
  });

  const cursorProduct = await prisma.product.upsert({
    where: { sku: 'CURSOR-PRO-1M' },
    update: {},
    create: {
      categoryId: devCategory.id,
      sku: 'CURSOR-PRO-1M',
      name: 'Cursor Pro 1 Month',
      slug: 'cursor-pro-1m',
      shortDescription: 'Pre-activated Cursor Pro account with fast premium model queries.',
      normalPrice: 14.0,
      deliveryType: DeliveryType.PRELOADED_ACCOUNT,
      deliverySpeed: DeliverySpeed.INSTANT,
      warrantyEnabled: true,
      warrantyDays: 30,
      minQuantity: 1,
      maxQuantity: 5,
      trackInventory: true,
      lowStockThreshold: 3,
      status: ProductStatus.ACTIVE,
      featured: true,
      sortOrder: 2,
    },
  });

  // 5. Seed initial encrypted inventory items
  const geminiLinks = [
    'https://one.google.com/promo/claim/gemini_pro_activation_token_1a2b3c',
    'https://one.google.com/promo/claim/gemini_pro_activation_token_4d5e6f',
    'https://one.google.com/promo/claim/gemini_pro_activation_token_7g8h9i',
  ];

  for (const link of geminiLinks) {
    const encrypted = encryptPayload({ activationUrl: link }, ENCRYPTION_KEY);
    await prisma.inventoryItem.create({
      data: {
        productId: geminiProduct.id,
        encryptedPayload: encrypted,
        purchaseCost: 0.35,
        purchaseReference: 'BATCH-GEMINI-01',
      },
    });
  }

  const cursorAccounts = [
    { email: 'dev_user1@cursor-vault.org', pass: 'CrsPass987!', notes: 'Clean profile' },
    { email: 'dev_user2@cursor-vault.org', pass: 'CrsPass456!', notes: 'Clean profile' },
  ];

  for (const acc of cursorAccounts) {
    const encrypted = encryptPayload(acc, ENCRYPTION_KEY);
    await prisma.inventoryItem.create({
      data: {
        productId: cursorProduct.id,
        encryptedPayload: encrypted,
        purchaseCost: 8.0,
        purchaseReference: 'BATCH-CURSOR-01',
      },
    });
  }

  // 6. System Settings
  const defaultSettings = [
    { key: 'store_name', value: 'Delux Store', description: 'Store branding name' },
    { key: 'support_username', value: '@thedeluxstorebot', description: 'Official support handle' },
    { key: 'referrals_enabled', value: true, description: 'Whether referral system is active' },
    { key: 'referral_rate', value: 10.0, description: 'Default commission percentage' },
    { key: 'minimum_deposit', value: 1.0, description: 'Minimum deposit in USD' },
    { key: 'maintenance_mode', value: false, description: 'Put bot in maintenance mode' },
    { key: 'usd_to_pkr_rate', value: 280.0, description: 'USD to PKR conversion rate for Pakistani audience' },
    { key: 'active_payment_mode', value: 'LOCAL_PK_FIRST', description: 'Payment modes display strategy in bot (LOCAL_PK_FIRST, LOCAL_PK_ONLY, CRYPTO_ONLY, ALL)' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 7. Seed Translations into DB
  for (const [lang, dict] of Object.entries(DEFAULT_TRANSLATIONS)) {
    const translationEntries = Object.entries(dict as Record<string, string>);
    for (const [key, value] of translationEntries) {
      await prisma.translation.upsert({
        where: {
          key_languageCode: {
            key,
            languageCode: lang,
          },
        },
        update: { value },
        create: {
          key,
          languageCode: lang,
          value,
        },
      });
    }
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
