// Bot Builder — Advanced Universal Types and Templates

export type ComponentType =
  | 'text'
  | 'image'
  | 'field'
  | 'quote'
  | 'numbered_list'
  | 'bullet_list'
  | 'divider'
  | 'spacer'
  | 'info_box'
  | 'alert_banner'
  | 'faq_item'
  | 'social_links'
  | 'button'
  | 'button_row'
  | 'button_grid'
  // Enterprise Automation & Media Types:
  | 'form_input'
  | 'ai_copilot'
  | 'carousel'
  | 'video_note'
  | 'audio'
  | 'stars_invoice';

export type ButtonType = 'callback' | 'url' | 'web_app' | 'screen' | 'payment';

export interface ButtonAnalytics {
  clicks: number;
  ctr: number; // percentage
  conversions?: number;
}

export interface BotButton {
  id: string;
  label: string;
  type?: ButtonType;
  action?: string;        // callback action
  url?: string;           // external URL
  webAppUrl?: string;     // Telegram Mini App URL
  targetScreen?: string;  // key of custom screen to navigate to
  fullWidth?: boolean;
  analytics?: ButtonAnalytics;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  emoji?: string;
}

export interface VisibilityCondition {
  field: 'always' | 'balance' | 'orders' | 'referrals' | 'has_ticket' | 'vip_member';
  operator: 'eq' | 'neq' | 'gt' | 'lt';
  value: string | number;
}

export interface FormInputConfig {
  promptText: string;
  fieldType: 'text' | 'number' | 'photo' | 'screenshot' | 'email';
  variableName: string;
  actionOnSubmit: 'save_variable' | 'create_claim' | 'create_order' | 'webhook';
  webhookUrl?: string;
}

export interface AiCopilotConfig {
  instruction?: string;
  knowledgeContext?: 'catalog' | 'faq' | 'orders' | 'general';
  handoffButtonLabel?: string;
  temperature?: number;
}

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  buttonScreen?: string;
}

export interface StarsInvoiceConfig {
  title: string;
  description: string;
  priceStars: number;
  currency: 'XTR' | 'USD' | 'EUR';
  payload: string;
}

export interface BotComponent {
  id: string;
  type: ComponentType;

  // Personalized Logic & Conditionals
  condition?: VisibilityCondition;

  // text & quote
  content?: string;
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
  author?: string; // for quote

  // image
  imageUrl?: string;
  caption?: string;

  // field
  emoji?: string;
  label?: string;
  value?: string;

  // lists (numbered or bullet)
  items?: string[];

  // info_box & alert_banner
  header?: string;
  body?: string;
  alertVariant?: 'info' | 'warning' | 'success' | 'danger';

  // faq_item
  question?: string;
  answer?: string;

  // social_links
  links?: SocialLinkItem[];

  // button (single)
  buttonType?: ButtonType;
  action?: string;
  url?: string;
  webAppUrl?: string;
  targetScreen?: string;

  // button rows & grids
  buttons?: BotButton[];

  // Enterprise Modules
  formConfig?: FormInputConfig;
  aiConfig?: AiCopilotConfig;
  carouselSlides?: CarouselSlide[];
  invoiceConfig?: StarsInvoiceConfig;
  mediaDurationSec?: number;
}

export interface ScreenTriggers {
  keywords?: string[];
  slashCommands?: string[];
  event?: 'none' | 'first_deposit' | 'order_completed' | 'abandoned_cart';
}

export interface ScreenAnalytics {
  impressions: number;
  uniqueUsers: number;
  avgEngagementSec: number;
}

export interface BotScreen {
  key: string;
  label: string;
  icon: string;
  description: string;
  category?: 'general' | 'store' | 'agency' | 'saas' | 'community' | 'support' | 'custom';
  isCustom?: boolean;
  components: BotComponent[];
  triggers?: ScreenTriggers;
  analytics?: ScreenAnalytics;
}

// Predefined universal bot callback actions
export const BOT_ACTIONS = [
  { value: 'nav_main', label: '🏠 Main Menu' },
  { value: 'nav_buy', label: '🛒 Buy / Catalog' },
  { value: 'nav_profile', label: '👤 User Profile' },
  { value: 'nav_orders', label: '📦 Orders History' },
  { value: 'nav_wallet', label: '💰 Wallet / Balance' },
  { value: 'nav_referral', label: '🔗 Referral System' },
  { value: 'nav_support', label: '💬 Support & Help' },
  { value: 'nav_language', label: '🌐 Change Language' },
  { value: 'support_order_issue', label: '📦 Order Problem' },
  { value: 'support_deposit_issue', label: '💰 Deposit Issue' },
  { value: 'support_warranty', label: '🛡 Warranty Claim' },
  { value: 'support_question', label: '❓ General Question' },
];

export interface TemplateVariable {
  key: string;
  desc: string;
  category: string;
  categoryIcon: string;
  example: string;
}

export const VARIABLE_CATEGORIES = [
  { id: 'all', name: 'All Variables', icon: '✨' },
  { id: 'user', name: 'User Profile', icon: '👤' },
  { id: 'wallet', name: 'Wallet & Money', icon: '💰' },
  { id: 'store', name: 'Store & Brand', icon: '🏪' },
  { id: 'ecommerce', name: 'Orders & Sales', icon: '📦' },
  { id: 'vps', name: 'VPS & Hosting', icon: '🖥️' },
  { id: 'ai', name: 'AI & License Keys', icon: '🤖' },
  { id: 'crypto', name: 'Crypto & FX', icon: '🪙' },
  { id: 'inventory', name: 'Catalog & Stock', icon: '📊' },
  { id: 'support', name: 'Support & Tickets', icon: '🎟️' },
  { id: 'system', name: 'Date & System', icon: '📅' },
] as const;

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // 1. User & Profile
  { key: 'username', desc: 'Telegram @username', category: 'user', categoryIcon: '👤', example: 'ahmed_hassan' },
  { key: 'firstName', desc: "User's first name", category: 'user', categoryIcon: '👤', example: 'Ahmed' },
  { key: 'lastName', desc: "User's last name", category: 'user', categoryIcon: '👤', example: 'Hassan' },
  { key: 'telegramId', desc: "User's numerical Telegram ID", category: 'user', categoryIcon: '👤', example: '617559388' },
  { key: 'memberSince', desc: 'Account registration date', category: 'user', categoryIcon: '👤', example: '2026-01-15' },
  { key: 'vipTier', desc: 'Loyalty rank (Standard / Gold / Platinum)', category: 'user', categoryIcon: '👤', example: 'Gold VIP' },
  { key: 'isVip', desc: 'VIP membership flag (1 or 0)', category: 'user', categoryIcon: '👤', example: '1' },
  { key: 'language', desc: 'Selected language code', category: 'user', categoryIcon: '👤', example: 'en' },

  // 2. Wallet & Balances
  { key: 'balance', desc: 'Available wallet balance in USD', category: 'wallet', categoryIcon: '💰', example: '45.50' },
  { key: 'balancePkr', desc: 'Wallet balance converted to PKR', category: 'wallet', categoryIcon: '💰', example: '12,740' },
  { key: 'currency', desc: 'Store currency code', category: 'wallet', categoryIcon: '💰', example: 'USD' },
  { key: 'currencySymbol', desc: 'Active currency symbol', category: 'wallet', categoryIcon: '💰', example: '$' },
  { key: 'deposited', desc: 'Lifetime total deposits ($)', category: 'wallet', categoryIcon: '💰', example: '150.00' },
  { key: 'spent', desc: 'Lifetime total spent ($)', category: 'wallet', categoryIcon: '💰', example: '104.50' },
  { key: 'referralEarnings', desc: 'Total affiliate commission earned ($)', category: 'wallet', categoryIcon: '💰', example: '18.20' },
  { key: 'minDeposit', desc: 'Minimum deposit required', category: 'wallet', categoryIcon: '💰', example: '$1.00' },
  { key: 'exchangeRate', desc: 'Live USD to PKR exchange rate', category: 'wallet', categoryIcon: '💰', example: '280' },
  { key: 'referralLink', desc: 'Personal affiliate invite URL', category: 'wallet', categoryIcon: '💰', example: 'https://t.me/Bot?start=ref_123' },
  { key: 'commissionRate', desc: 'Affiliate commission percentage', category: 'wallet', categoryIcon: '💰', example: '10%' },

  // 3. Store & Brand Info
  { key: 'storeName', desc: 'Business / Bot brand name', category: 'store', categoryIcon: '🏪', example: 'Your Store' },
  { key: 'storeTagline', desc: 'Store slogan or proposition', category: 'store', categoryIcon: '🏪', example: 'Premium Digital Services' },
  { key: 'botUsername', desc: 'Bot Telegram username', category: 'store', categoryIcon: '🏪', example: '@yourshopbot' },
  { key: 'supportUsername', desc: 'Official customer support @handle', category: 'store', categoryIcon: '🏪', example: '@yoursupport' },
  { key: 'channelLink', desc: 'Official news channel URL', category: 'store', categoryIcon: '🏪', example: 'https://t.me/yournews' },
  { key: 'websiteUrl', desc: 'External web portal link', category: 'store', categoryIcon: '🏪', example: 'https://yourstore.io' },
  { key: 'operationalHours', desc: 'Live operating availability', category: 'store', categoryIcon: '🏪', example: '24/7 Automated' },

  // 4. E-Commerce & Orders
  { key: 'orders', desc: 'Total lifetime orders count', category: 'ecommerce', categoryIcon: '📦', example: '12' },
  { key: 'orderNumber', desc: 'Order tracking identifier', category: 'ecommerce', categoryIcon: '📦', example: '10042' },
  { key: 'productName', desc: 'Item / service title', category: 'ecommerce', categoryIcon: '📦', example: 'ChatGPT Enterprise 1-Year' },
  { key: 'unitPrice', desc: 'Unit price per item', category: 'ecommerce', categoryIcon: '📦', example: '14.99' },
  { key: 'quantity', desc: 'Purchased quantity', category: 'ecommerce', categoryIcon: '📦', example: '1' },
  { key: 'total', desc: 'Checkout total price ($)', category: 'ecommerce', categoryIcon: '📦', example: '14.99' },
  { key: 'afterBalance', desc: 'Remaining balance after checkout', category: 'ecommerce', categoryIcon: '📦', example: '30.51' },
  { key: 'lastOrderStatus', desc: 'Status of recent order', category: 'ecommerce', categoryIcon: '📦', example: 'DELIVERED' },

  // 5. VPS & Cloud Hosting
  { key: 'vps.ip', desc: 'Server dedicated public IPv4 address', category: 'vps', categoryIcon: '🖥️', example: '185.192.110.42' },
  { key: 'vps.os', desc: 'Operating system and distribution', category: 'vps', categoryIcon: '🖥️', example: 'Ubuntu 24.04 LTS' },
  { key: 'vps.ram', desc: 'Allocated RAM memory specs', category: 'vps', categoryIcon: '🖥️', example: '8GB DDR5 ECC' },
  { key: 'vps.cpu', desc: 'vCPU compute cores allocated', category: 'vps', categoryIcon: '🖥️', example: '4 vCPU (AMD EPYC)' },
  { key: 'vps.bandwidth', desc: 'Monthly bandwidth quota', category: 'vps', categoryIcon: '🖥️', example: '10TB Unmetered' },
  { key: 'vps.location', desc: 'Datacenter region and city', category: 'vps', categoryIcon: '🖥️', example: 'Frankfurt, Germany' },
  { key: 'vps.status', desc: 'Current server power state', category: 'vps', categoryIcon: '🖥️', example: 'RUNNING' },
  { key: 'vps.expiryDate', desc: 'Hosting service renewal due date', category: 'vps', categoryIcon: '🖥️', example: '2026-10-29' },

  // 6. AI Tools & Software Licenses
  { key: 'license.key', desc: 'Serial / activation license key', category: 'ai', categoryIcon: '🤖', example: 'GPT-PRO-9821-XKQW-2026' },
  { key: 'license.plan', desc: 'AI or software tier name', category: 'ai', categoryIcon: '🤖', example: 'Claude 3.5 Sonnet Pro' },
  { key: 'license.expiry', desc: 'License subscription end date', category: 'ai', categoryIcon: '🤖', example: '2027-01-01' },
  { key: 'license.devices', desc: 'Max concurrent device seats', category: 'ai', categoryIcon: '🤖', example: '3 Concurrent Devices' },
  { key: 'api.quota_left', desc: 'Remaining API query tokens', category: 'ai', categoryIcon: '🤖', example: '450,000 credits' },

  // 7. Crypto Rates & FX
  { key: 'crypto.btc_rate', desc: 'Real-time Bitcoin price in USD', category: 'crypto', categoryIcon: '🪙', example: '68,450' },
  { key: 'crypto.eth_rate', desc: 'Real-time Ethereum price in USD', category: 'crypto', categoryIcon: '🪙', example: '3,520' },
  { key: 'crypto.ton_rate', desc: 'Real-time Telegram TON coin price', category: 'crypto', categoryIcon: '🪙', example: '5.20' },
  { key: 'crypto.usdt_rate', desc: 'USDT Tether peg rate', category: 'crypto', categoryIcon: '🪙', example: '1.00' },
  { key: 'fx.usd_to_pkr', desc: 'Current USD to PKR exchange rate', category: 'crypto', categoryIcon: '🪙', example: '280.00' },

  // 8. Catalog & Inventory
  { key: 'inventory.in_stock_count', desc: 'Total items in stock storewide', category: 'inventory', categoryIcon: '📊', example: '342' },
  { key: 'inventory.total_products', desc: 'Total active products in catalog', category: 'inventory', categoryIcon: '📊', example: '28' },
  { key: 'inventory.stock', desc: 'Stock level for active selected item', category: 'inventory', categoryIcon: '📊', example: '15' },

  // 9. Support & Warranty
  { key: 'support.open_tickets', desc: 'Count of customer open tickets', category: 'support', categoryIcon: '🎟️', example: '0' },
  { key: 'ticketNumber', desc: 'Active support ticket ID', category: 'support', categoryIcon: '🎟️', example: 'TCK-8921' },
  { key: 'warranty', desc: 'Warranty duration & terms', category: 'support', categoryIcon: '🎟️', example: '30 Days Instant Replacement' },

  // 10. System & Dynamic Dates
  { key: 'date.today', desc: "Today's human-readable date", category: 'system', categoryIcon: '📅', example: 'Sep 29, 2026' },
  { key: 'time.now', desc: 'Current UTC time', category: 'system', categoryIcon: '📅', example: '21:05 UTC' },
  { key: 'year', desc: 'Current calendar year', category: 'system', categoryIcon: '📅', example: '2026' },
];

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// Initial Preset Screens across multiple industries
export const DEFAULT_SCREENS: BotScreen[] = [
  // 1. Welcome / Home Screen
  {
    key: 'welcome',
    label: 'Welcome / Home',
    icon: '🏠',
    description: 'Main landing menu sent when user starts the bot',
    category: 'general',
    triggers: {
      slashCommands: ['/start', '/menu', '/home'],
      keywords: ['start', 'menu', 'home', 'main'],
    },
    components: [
      {
        id: uid(),
        type: 'text',
        content: '🌟 Welcome to {storeName}!',
        bold: true,
      },
      {
        id: uid(),
        type: 'text',
        content: 'Your premier automated platform. Explore our services, manage your account, or speak with our team below.',
      },
      { id: uid(), type: 'divider' },
      {
        id: uid(),
        type: 'button_grid',
        buttons: [
          { id: uid(), label: '✨ Explore Services', type: 'callback', action: 'nav_buy', fullWidth: true },
          { id: uid(), label: '👤 My Profile', type: 'callback', action: 'nav_profile' },
          { id: uid(), label: '💰 Wallet', type: 'callback', action: 'nav_wallet' },
          { id: uid(), label: '📦 Orders', type: 'callback', action: 'nav_orders' },
          { id: uid(), label: '🔗 Affiliate', type: 'callback', action: 'nav_referral' },
          { id: uid(), label: '💬 Support Desk', type: 'callback', action: 'nav_support', fullWidth: true },
        ],
      },
    ],
  },

  // 2. Agency & Services Showcase
  {
    key: 'services',
    label: 'Services & Pricing',
    icon: '💼',
    description: 'Showcase digital agency services, freelance work, or SaaS plans',
    category: 'agency',
    triggers: {
      keywords: ['price', 'pricing', 'service', 'services', 'packages', 'quote', 'cost', 'rates', 'discount'],
      slashCommands: ['/services', '/pricing', '/quote'],
    },
    components: [
      { id: uid(), type: 'text', content: '💼 Our Services & Solutions', bold: true },
      { id: uid(), type: 'quote', content: 'High performance solutions engineered to accelerate your business growth.' },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '🚀', label: 'Web & App Dev', value: 'Full-stack custom builds' },
      { id: uid(), type: 'field', emoji: '🤖', label: 'Bot Automation', value: 'Telegram & AI agents' },
      { id: uid(), type: 'field', emoji: '📈', label: 'Growth & SEO', value: 'Traffic & conversion systems' },
      { id: uid(), type: 'spacer' },
      {
        id: uid(),
        type: 'alert_banner',
        alertVariant: 'success',
        header: '🎉 Limited Time Offer',
        body: 'Mention this bot to receive a 15% discount on all custom development packages this month!',
      },
      {
        id: uid(),
        type: 'button_grid',
        buttons: [
          { id: uid(), label: '📅 Book a Free Consultation', type: 'url', url: 'https://calendly.com', fullWidth: true },
          { id: uid(), label: '💬 Contact Our Lead Architect', type: 'callback', action: 'nav_support' },
          { id: uid(), label: '🏠 Main Menu', type: 'callback', action: 'nav_main' },
        ],
      },
    ],
  },

  // 3. Mini-App / SaaS Launcher
  {
    key: 'web_app',
    label: 'Mini App Launcher',
    icon: '⚡',
    description: 'Launch Telegram Mini App (Web App) inside Telegram',
    category: 'saas',
    triggers: {
      keywords: ['app', 'miniapp', 'webapp', 'portal', 'dashboard'],
      slashCommands: ['/app', '/dashboard'],
    },
    components: [
      { id: uid(), type: 'text', content: '⚡ {storeName} Mini App', bold: true },
      { id: uid(), type: 'text', content: 'Launch our interactive full-screen application without ever leaving Telegram!' },
      { id: uid(), type: 'divider' },
      {
        id: uid(),
        type: 'bullet_list',
        items: [
          '⚡ Lightning fast cloud synchronization',
          '🔒 End-to-end encrypted user sessions',
          '📱 Seamless mobile-first touchscreen controls',
        ],
      },
      { id: uid(), type: 'spacer' },
      {
        id: uid(),
        type: 'button_grid',
        buttons: [
          {
            id: uid(),
            label: '🚀 Open Web Application',
            type: 'web_app',
            webAppUrl: 'https://telegram.org',
            fullWidth: true,
          },
          { id: uid(), label: '🏠 Return to Menu', type: 'callback', action: 'nav_main', fullWidth: true },
        ],
      },
    ],
  },

  // 4. FAQ & Knowledge Base
  {
    key: 'faq',
    label: 'FAQ & Knowledge Base',
    icon: '❓',
    description: 'Frequently asked questions, guides, and policies',
    category: 'support',
    triggers: {
      keywords: ['faq', 'question', 'questions', 'helpdesk', 'policy', 'refund', 'terms'],
      slashCommands: ['/faq', '/helpdesk'],
    },
    components: [
      { id: uid(), type: 'text', content: '❓ Frequently Asked Questions', bold: true },
      { id: uid(), type: 'text', content: 'Answers to the most common questions about our platform and services.' },
      { id: uid(), type: 'divider' },
      {
        id: uid(),
        type: 'faq_item',
        question: 'How fast is delivery?',
        answer: 'All automated digital items are delivered instantly within 30 seconds of confirmed transaction.',
      },
      {
        id: uid(),
        type: 'faq_item',
        question: 'What payment methods do you accept?',
        answer: 'We accept Crypto (USDT, TON, BTC, ETH) as well as local bank transfers and instant mobile wallets.',
      },
      {
        id: uid(),
        type: 'faq_item',
        question: 'What is your refund / warranty policy?',
        answer: 'We provide an unconditional 30-day replacement warranty on all authorized digital licenses.',
      },
      { id: uid(), type: 'spacer' },
      {
        id: uid(),
        type: 'button_row',
        buttons: [
          { id: uid(), label: '💬 Ask a Question', type: 'callback', action: 'nav_support' },
          { id: uid(), label: '🏠 Main Menu', type: 'callback', action: 'nav_main' },
        ],
      },
    ],
  },

  // 5. Community & Official Links
  {
    key: 'community',
    label: 'Community & Socials',
    icon: '🌐',
    description: 'Official social media, channel links, and community groups',
    category: 'community',
    triggers: {
      keywords: ['community', 'channel', 'chat', 'group', 'socials', 'telegram', 'twitter'],
      slashCommands: ['/community', '/socials'],
    },
    components: [
      { id: uid(), type: 'text', content: '🌐 Join Our Global Community', bold: true },
      { id: uid(), type: 'text', content: 'Stay updated with daily announcements, giveaways, and customer support channels.' },
      { id: uid(), type: 'divider' },
      {
        id: uid(),
        type: 'social_links',
        links: [
          { id: uid(), platform: 'Telegram', label: 'Official Channel', url: 'https://t.me/telegram', emoji: '📢' },
          { id: uid(), platform: 'Telegram', label: 'Discussion Group', url: 'https://t.me/telegram', emoji: '👥' },
          { id: uid(), platform: 'Twitter', label: 'Twitter / X', url: 'https://twitter.com', emoji: '🐦' },
          { id: uid(), platform: 'Web', label: 'Official Website', url: 'https://google.com', emoji: '🌍' },
        ],
      },
      { id: uid(), type: 'spacer' },
      { id: uid(), type: 'button', label: '🏠 Main Menu', buttonType: 'callback', action: 'nav_main' },
    ],
  },

  // 6. Wallet / Finance
  {
    key: 'wallet',
    label: 'Wallet & Ledger',
    icon: '💰',
    description: 'Wallet balance, transaction ledger, and deposit methods',
    category: 'store',
    triggers: {
      keywords: ['wallet', 'deposit', 'balance', 'funds', 'topup', 'pay', 'money'],
      slashCommands: ['/wallet', '/deposit', '/balance'],
    },
    components: [
      { id: uid(), type: 'text', content: '💰 My Account Wallet', bold: true },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '💵', label: 'Current Balance', value: '${balance}' },
      { id: uid(), type: 'field', emoji: '📥', label: 'Lifetime Deposited', value: '${deposited}' },
      { id: uid(), type: 'field', emoji: '🛍', label: 'Lifetime Spent', value: '${spent}' },
      { id: uid(), type: 'spacer' },
      { id: uid(), type: 'text', content: 'Select an option below to deposit funds or view ledger history:' },
      {
        id: uid(),
        type: 'button_grid',
        buttons: [
          { id: uid(), label: '📥 Add Funds / Deposit', type: 'callback', action: 'nav_wallet', fullWidth: true },
          { id: uid(), label: '🏠 Main Menu', type: 'callback', action: 'nav_main', fullWidth: true },
        ],
      },
    ],
  },

  // 7. Support & Claims
  {
    key: 'support',
    label: 'Support & Help Desk',
    icon: '💬',
    description: 'Customer ticket dispatch and issue resolution menu',
    category: 'support',
    triggers: {
      keywords: ['support', 'help', 'human', 'agent', 'operator', 'ticket', 'issue', 'problem', 'claim'],
      slashCommands: ['/support', '/help', '/human'],
    },
    components: [
      { id: uid(), type: 'text', content: '💬 Customer Support Desk', bold: true },
      { id: uid(), type: 'text', content: 'Please select what category best describes your inquiry:' },
      { id: uid(), type: 'spacer' },
      {
        id: uid(),
        type: 'button_grid',
        buttons: [
          { id: uid(), label: '📦 Order Delivery Issue', type: 'callback', action: 'support_order_issue', fullWidth: true },
          { id: uid(), label: '💰 Deposit / Payment Problem', type: 'callback', action: 'support_deposit_issue', fullWidth: true },
          { id: uid(), label: '🛡 Warranty & Replacement', type: 'callback', action: 'support_warranty', fullWidth: true },
          { id: uid(), label: '❓ General Inquiries', type: 'callback', action: 'support_question', fullWidth: true },
          { id: uid(), label: '← Return to Menu', type: 'callback', action: 'nav_main', fullWidth: true },
        ],
      },
    ],
  },

  // 8. Profile
  {
    key: 'profile',
    label: 'User Profile',
    icon: '👤',
    description: 'Detailed user identity and activity statistics',
    category: 'general',
    triggers: {
      keywords: ['profile', 'account', 'me', 'id', 'user'],
      slashCommands: ['/profile', '/account', '/me'],
    },
    components: [
      { id: uid(), type: 'text', content: '👤 Account Overview', bold: true },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '🔖', label: 'Username', value: '@{username}' },
      { id: uid(), type: 'field', emoji: '🆔', label: 'Telegram ID', value: '{telegramId}' },
      { id: uid(), type: 'field', emoji: '💰', label: 'Balance', value: '${balance}' },
      { id: uid(), type: 'field', emoji: '📦', label: 'Orders Completed', value: '{orders}' },
      { id: uid(), type: 'field', emoji: '🔗', label: 'Referrals Invited', value: '{referrals}' },
      { id: uid(), type: 'field', emoji: '📅', label: 'Member Since', value: '{memberSince}' },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'button', label: '🏠 Main Menu', buttonType: 'callback', action: 'nav_main' },
    ],
  },
];
