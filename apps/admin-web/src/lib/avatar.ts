/**
 * Avatar utility for deterministic face avatars
 * Uses DiceBear Notionist 9.x collection for sleek, modern Notion-style illustrated human face portraits.
 */

export function getNotionistAvatarUrl(seed: string): string {
  const sanitized = encodeURIComponent(seed.trim().toLowerCase() || 'operator');
  // Background colors: soft modern slate, warm neutrals, and light pastel tones
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${sanitized}&backgroundColor=e2e8f0,cbd5e1,f1f5f9,fed7aa,fef08a,bbf7d0,bfdbfe,ddd6fe&scale=90`;
}

export function getUserAvatarUrl(user?: { name?: string | null; email?: string | null } | null): string {
  const seed = user?.email || user?.name || 'operator';
  return getNotionistAvatarUrl(seed);
}

export function getCustomerAvatarUrl(customer: {
  telegramUsername?: string | null;
  telegramUserId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const seed = customer.telegramUsername || customer.telegramUserId || `${customer.firstName || ''}_${customer.lastName || ''}` || 'customer';
  return getNotionistAvatarUrl(seed);
}
