// Bot Builder — shared types and default screen definitions

export type ComponentType =
  | 'text'
  | 'field'
  | 'numbered_list'
  | 'divider'
  | 'spacer'
  | 'info_box'
  | 'button'
  | 'button_row'
  | 'button_grid';

export interface BotButton {
  id: string;
  label: string;
  action: string;
  fullWidth?: boolean;
}

export interface BotComponent {
  id: string;
  type: ComponentType;
  // text
  content?: string;
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
  // field
  emoji?: string;
  label?: string;
  value?: string;
  // numbered_list
  items?: string[];
  // info_box
  header?: string;
  body?: string;
  // buttons
  buttons?: BotButton[];
  // button (single)
  action?: string;
}

export interface BotScreen {
  key: string;
  label: string;
  icon: string;
  description: string;
  components: BotComponent[];
}

// Predefined bot callback actions
export const BOT_ACTIONS = [
  { value: 'nav_main', label: '🏠 Main Menu' },
  { value: 'nav_buy', label: '🛒 Buy / Browse' },
  { value: 'nav_profile', label: '👤 Profile' },
  { value: 'nav_orders', label: '📦 Orders' },
  { value: 'nav_wallet', label: '💰 Wallet' },
  { value: 'nav_referral', label: '🔗 Referral' },
  { value: 'nav_support', label: '💬 Support' },
  { value: 'nav_language', label: '🌐 Language' },
  { value: 'support_order_issue', label: '📦 Order Problem' },
  { value: 'support_deposit_issue', label: '💰 Deposit Problem' },
  { value: 'support_warranty', label: '🛡 Warranty' },
  { value: 'support_question', label: '❓ Product Question' },
];

export const TEMPLATE_VARIABLES = [
  { key: 'storeName', desc: 'Store name' },
  { key: 'balance', desc: "User's wallet balance" },
  { key: 'username', desc: 'Telegram @username' },
  { key: 'firstName', desc: "User's first name" },
  { key: 'orderNumber', desc: 'Order number' },
  { key: 'productName', desc: 'Product name' },
  { key: 'totalAmount', desc: 'Order total' },
  { key: 'networkName', desc: 'Payment method name' },
  { key: 'accountNumber', desc: 'Payment account number' },
  { key: 'accountTitle', desc: 'Payment account title' },
  { key: 'minDeposit', desc: 'Minimum deposit amount' },
  { key: 'exchangeRate', desc: 'USD/PKR exchange rate' },
  { key: 'referralLink', desc: 'Referral link' },
  { key: 'commissionRate', desc: 'Referral commission %' },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const DEFAULT_SCREENS: BotScreen[] = [
  {
    key: 'welcome',
    label: 'Welcome Menu',
    icon: '🏠',
    description: 'Shown when user sends /start',
    components: [
      { id: uid(), type: 'text', content: '🎉 Welcome to {storeName}', bold: true },
      { id: uid(), type: 'text', content: 'Browse and purchase digital products instantly.' },
      { id: uid(), type: 'spacer' },
      {
        id: uid(),
        type: 'button_grid',
        buttons: [
          { id: uid(), label: '🛒 Buy', action: 'nav_buy', fullWidth: true },
          { id: uid(), label: '👤 Profile', action: 'nav_profile' },
          { id: uid(), label: '📦 Orders', action: 'nav_orders' },
          { id: uid(), label: '💰 Wallet', action: 'nav_wallet' },
          { id: uid(), label: '🔗 Referral', action: 'nav_referral' },
          { id: uid(), label: '💬 Support', action: 'nav_support', fullWidth: true },
          { id: uid(), label: '🌐 Language', action: 'nav_language', fullWidth: true },
        ],
      },
    ],
  },
  {
    key: 'wallet',
    label: 'Wallet Screen',
    icon: '💰',
    description: 'Wallet balance + deposit options',
    components: [
      { id: uid(), type: 'text', content: '💰 My Wallet', bold: true },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '💵', label: 'Balance', value: '${balance}' },
      { id: uid(), type: 'field', emoji: '📥', label: 'Total Deposited', value: '${deposited}' },
      { id: uid(), type: 'field', emoji: '🛍', label: 'Total Spent', value: '${spent}' },
      { id: uid(), type: 'spacer' },
      { id: uid(), type: 'text', content: 'Choose a deposit method:' },
    ],
  },
  {
    key: 'payment_card',
    label: 'Payment Card',
    icon: '💳',
    description: 'Payment method detail with instructions',
    components: [
      { id: uid(), type: 'text', content: '🇵🇰 {networkName} Payment Details', bold: true },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '👤', label: 'Account Title', value: '{accountTitle}' },
      { id: uid(), type: 'field', emoji: '🔢', label: 'Account Number', value: '{accountNumber}' },
      { id: uid(), type: 'field', emoji: '💵', label: 'Minimum Deposit', value: '{minDeposit}' },
      { id: uid(), type: 'field', emoji: '📈', label: 'Current Rate', value: '$1.00 USD = Rs. {exchangeRate} PKR' },
      { id: uid(), type: 'spacer' },
      {
        id: uid(),
        type: 'info_box',
        header: '📌 Instructions',
        body: '1. Open the app and transfer to account above.\n2. In payment purpose select "Online Purchase".\n3. Reply to this bot with your 11-digit TRX ID from the payment SMS.',
      },
      { id: uid(), type: 'divider' },
      {
        id: uid(),
        type: 'info_box',
        header: '📩 What to do after sending payment:',
        body: 'Please reply to this message with your *Transaction ID (TID / TRX ID)* from your SMS/Receipt.\n\nExample: `12345678901` or reference number.',
      },
      { id: uid(), type: 'button', label: '← Back', action: 'nav_wallet' },
    ],
  },
  {
    key: 'product',
    label: 'Product View',
    icon: '🛍',
    description: 'Individual product detail page',
    components: [
      { id: uid(), type: 'text', content: '🛍 {productName}', bold: true },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '💵', label: 'Price', value: '${price}' },
      { id: uid(), type: 'field', emoji: '📦', label: 'Stock', value: '{stock} available' },
      { id: uid(), type: 'field', emoji: '⚡', label: 'Delivery', value: '{deliveryType}' },
      { id: uid(), type: 'field', emoji: '🛡', label: 'Warranty', value: '{warranty}' },
      { id: uid(), type: 'field', emoji: '💰', label: 'Your Balance', value: '${balance}' },
    ],
  },
  {
    key: 'order_confirm',
    label: 'Order Confirmation',
    icon: '✅',
    description: 'Checkout confirmation screen',
    components: [
      { id: uid(), type: 'text', content: '🧾 Confirm Purchase', bold: true },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '🛍', label: 'Product', value: '{productName}' },
      { id: uid(), type: 'field', emoji: '🔢', label: 'Quantity', value: '{quantity}' },
      { id: uid(), type: 'field', emoji: '💵', label: 'Unit Price', value: '${unitPrice}' },
      { id: uid(), type: 'field', emoji: '💳', label: 'Total', value: '${total}' },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '💰', label: 'Wallet Balance', value: '${balance}' },
      { id: uid(), type: 'field', emoji: '📊', label: 'After Purchase', value: '${afterBalance}' },
      {
        id: uid(),
        type: 'button_row',
        buttons: [
          { id: uid(), label: '✅ Confirm Purchase', action: 'confirm_order' },
          { id: uid(), label: '❌ Cancel', action: 'nav_main' },
        ],
      },
    ],
  },
  {
    key: 'support',
    label: 'Support Screen',
    icon: '💬',
    description: 'Support options menu',
    components: [
      { id: uid(), type: 'text', content: '💬 Customer Support', bold: true },
      { id: uid(), type: 'text', content: 'How can we help you today?' },
      { id: uid(), type: 'spacer' },
      {
        id: uid(),
        type: 'button_grid',
        buttons: [
          { id: uid(), label: '📦 Order Problem', action: 'support_order_issue', fullWidth: true },
          { id: uid(), label: '💰 Deposit Problem', action: 'support_deposit_issue', fullWidth: true },
          { id: uid(), label: '🛡 Warranty / Replacement', action: 'support_warranty', fullWidth: true },
          { id: uid(), label: '❓ Product Question', action: 'support_question', fullWidth: true },
          { id: uid(), label: '← Back', action: 'nav_main', fullWidth: true },
        ],
      },
    ],
  },
  {
    key: 'profile',
    label: 'Profile Screen',
    icon: '👤',
    description: 'Customer profile display',
    components: [
      { id: uid(), type: 'text', content: '👤 Customer Profile', bold: true },
      { id: uid(), type: 'divider' },
      { id: uid(), type: 'field', emoji: '🔖', label: 'Username', value: '@{username}' },
      { id: uid(), type: 'field', emoji: '🆔', label: 'Telegram ID', value: '{telegramId}' },
      { id: uid(), type: 'field', emoji: '💰', label: 'Balance', value: '${balance}' },
      { id: uid(), type: 'field', emoji: '📥', label: 'Total Deposited', value: '${deposited}' },
      { id: uid(), type: 'field', emoji: '🛍', label: 'Total Spent', value: '${spent}' },
      { id: uid(), type: 'field', emoji: '📦', label: 'Orders', value: '{orders}' },
      { id: uid(), type: 'field', emoji: '🔗', label: 'Referrals', value: '{referrals}' },
      { id: uid(), type: 'field', emoji: '📅', label: 'Member Since', value: '{memberSince}' },
      {
        id: uid(),
        type: 'button',
        label: '🏠 Main Menu',
        action: 'nav_main',
      },
    ],
  },
];
