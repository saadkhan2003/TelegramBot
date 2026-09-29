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
  | 'button_grid';

export type ButtonType = 'callback' | 'url' | 'web_app' | 'screen';

export interface BotButton {
  id: string;
  label: string;
  type?: ButtonType;
  action?: string;        // callback action
  url?: string;           // external URL
  webAppUrl?: string;     // Telegram Mini App URL
  targetScreen?: string;  // key of custom screen to navigate to
  fullWidth?: boolean;
}

export interface SocialLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  emoji?: string;
}

export interface BotComponent {
  id: string;
  type: ComponentType;

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
}

export interface BotScreen {
  key: string;
  label: string;
  icon: string;
  description: string;
  category?: 'general' | 'store' | 'agency' | 'saas' | 'community' | 'support' | 'custom';
  isCustom?: boolean;
  components: BotComponent[];
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

export const TEMPLATE_VARIABLES = [
  // User Profile
  { key: 'username', desc: 'Telegram @username' },
  { key: 'firstName', desc: "User's first name" },
  { key: 'lastName', desc: "User's last name" },
  { key: 'telegramId', desc: "User's Telegram ID" },
  { key: 'balance', desc: 'Wallet balance ($)' },
  { key: 'deposited', desc: 'Total deposited ($)' },
  { key: 'spent', desc: 'Total spent ($)' },
  { key: 'orders', desc: 'Total orders count' },
  { key: 'referrals', desc: 'Total invited users' },
  { key: 'memberSince', desc: 'Account registration date' },

  // Brand & Business
  { key: 'storeName', desc: 'Business / Bot name' },
  { key: 'storeTagline', desc: 'Company tagline or slogan' },
  { key: 'supportUsername', desc: 'Support Telegram username' },
  { key: 'channelLink', desc: 'Official Telegram channel' },
  { key: 'websiteUrl', desc: 'Main website link' },

  // E-commerce & Orders
  { key: 'orderNumber', desc: 'Order tracking number' },
  { key: 'productName', desc: 'Item / Service name' },
  { key: 'unitPrice', desc: 'Individual item price' },
  { key: 'quantity', desc: 'Purchased quantity' },
  { key: 'total', desc: 'Total checkout price' },

  // Finance & Deposits
  { key: 'networkName', desc: 'Payment method name' },
  { key: 'accountNumber', desc: 'Receiving account / wallet' },
  { key: 'accountTitle', desc: 'Account title / recipient' },
  { key: 'minDeposit', desc: 'Minimum deposit required' },
  { key: 'exchangeRate', desc: 'Currency exchange rate' },
  { key: 'referralLink', desc: 'Personal affiliate link' },
  { key: 'commissionRate', desc: 'Affiliate commission %' },
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
