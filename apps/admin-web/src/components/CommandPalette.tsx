'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  Search,
  ShoppingBag,
  Package,
  Layers,
  Users,
  ArrowDownCircle,
  Wallet,
  Settings,
  Shield,
  Bot,
  Plus,
  X,
  ExternalLink,
  LifeBuoy,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  KeyRound,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react';
import { fetchApi } from '../lib/api';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Products' | 'Customers' | 'Orders';
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette({ isOpen, onClose, initialQuery = '' }: CommandPaletteProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Live entity search results
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update query if initialQuery changes
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  // Load preview entities when command palette opens
  useEffect(() => {
    if (!isOpen) return;

    setLoadingEntities(true);
    Promise.allSettled([
      fetchApi('/admin/products').catch(() => ({ data: [] })),
      fetchApi('/admin/customers').catch(() => ({ data: [] })),
      fetchApi('/admin/orders').catch(() => ({ data: [] })),
    ]).then(([prodRes, custRes, ordRes]) => {
      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value?.data || prodRes.value || []);
      }
      if (custRes.status === 'fulfilled') {
        setCustomers(custRes.value?.data || custRes.value || []);
      }
      if (ordRes.status === 'fulfilled') {
        setOrders(ordRes.value?.data || ordRes.value || []);
      }
      setLoadingEntities(false);
    });
  }, [isOpen]);

  // Static navigation routes & common actions
  const staticItems: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Dashboard Overview',
        subtitle: 'Store metrics, revenue telemetry & telemetry graphs',
        icon: <LayoutDashboard className="h-4 w-4 text-[#0078d4]" />,
        action: () => {
          router.push('/');
          onClose();
        },
        keywords: ['home', 'stats', 'analytics', 'revenue'],
      },
      {
        id: 'nav-products',
        category: 'Navigation',
        title: 'Products Catalog',
        subtitle: 'Digital items, tiered subscription SKUs & activation pricing',
        badge: 'Catalog',
        badgeColor: 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]',
        icon: <Package className="h-4 w-4 text-[#0078d4]" />,
        action: () => {
          router.push('/products');
          onClose();
        },
        keywords: ['item', 'stock', 'pricing', 'sku', 'activation'],
      },
      {
        id: 'nav-inventory',
        category: 'Navigation',
        title: 'Inventory & Stock Vault',
        subtitle: 'AES-256 encrypted keys, stock replenishment & batch import',
        badge: 'Secure',
        badgeColor: 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]',
        icon: <Layers className="h-4 w-4 text-[#107c10]" />,
        action: () => {
          router.push('/inventory');
          onClose();
        },
        keywords: ['keys', 'credentials', 'import', 'tokens', 'units'],
      },
      {
        id: 'nav-orders',
        category: 'Navigation',
        title: 'Orders Management',
        subtitle: 'Fulfillment queue, automatic deliveries & instant refunds',
        badge: 'Live Queue',
        badgeColor: 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc]',
        icon: <ShoppingBag className="h-4 w-4 text-[#8a3707]" />,
        action: () => {
          router.push('/orders');
          onClose();
        },
        keywords: ['purchases', 'deliveries', 'sales', 'refunds', 'fulfill'],
      },
      {
        id: 'nav-deposits',
        category: 'Navigation',
        title: 'Deposits & Payments',
        subtitle: 'Pakistani Banks (Raast), JazzCash, EasyPaisa & Crypto on-chain ledger',
        icon: <ArrowDownCircle className="h-4 w-4 text-[#0078d4]" />,
        action: () => {
          router.push('/deposits');
          onClose();
        },
        keywords: ['jazzcash', 'easypaisa', 'bank', 'raast', 'crypto', 'verify'],
      },
      {
        id: 'nav-wallets',
        category: 'Navigation',
        title: 'Wallets & Ledger',
        subtitle: 'Customer ledger records, stored values & treasury balances',
        icon: <Wallet className="h-4 w-4 text-[#107c10]" />,
        action: () => {
          router.push('/wallets');
          onClose();
        },
        keywords: ['balances', 'funds', 'ledger', 'adjustments'],
      },
      {
        id: 'nav-customers',
        category: 'Navigation',
        title: 'Customer Accounts',
        subtitle: 'Telegram identities, total spend & account security locks',
        icon: <Users className="h-4 w-4 text-[#0078d4]" />,
        action: () => {
          router.push('/customers');
          onClose();
        },
        keywords: ['users', 'clients', 'telegram', 'accounts', 'buyer'],
      },
      {
        id: 'nav-support',
        category: 'Navigation',
        title: 'Support & Claims',
        subtitle: 'Warranty replacement tickets, buyer inquiries & claims resolution',
        icon: <LifeBuoy className="h-4 w-4 text-[#d13438]" />,
        action: () => {
          router.push('/support');
          onClose();
        },
        keywords: ['tickets', 'claims', 'warranty', 'help', 'disputes'],
      },
      {
        id: 'nav-settings',
        category: 'Navigation',
        title: 'System Settings & Fleet',
        subtitle: 'Multi-store configurations, bot tokens, audit logs & staff access',
        icon: <Settings className="h-4 w-4 text-[#605e5c]" />,
        action: () => {
          router.push('/settings');
          onClose();
        },
        keywords: ['config', 'fleet', 'bot', 'tokens', 'permissions', 'audit'],
      },

      // Actions
      {
        id: 'action-create-product',
        category: 'Actions',
        title: 'Create New Product SKU',
        subtitle: 'Publish a new digital asset to the Telegram Bot store',
        badge: 'Action',
        badgeColor: 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]',
        icon: <Plus className="h-4 w-4 text-[#0078d4]" />,
        action: () => {
          router.push('/products');
          onClose();
        },
        keywords: ['new', 'add', 'product', 'create'],
      },
      {
        id: 'action-import-stock',
        category: 'Actions',
        title: 'Import Stock Batch',
        subtitle: 'Bulk upload pipeline for activation keys & credentials',
        badge: 'Action',
        badgeColor: 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]',
        icon: <Layers className="h-4 w-4 text-[#107c10]" />,
        action: () => {
          router.push('/inventory');
          onClose();
        },
        keywords: ['import', 'bulk', 'keys', 'upload', 'stock'],
      },
      {
        id: 'action-view-bot',
        category: 'Actions',
        title: 'Open Telegram Bot Channel',
        subtitle: 'Launch @thedeluxstorebot in Telegram client',
        badge: 'External',
        badgeColor: 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]',
        icon: <Bot className="h-4 w-4 text-[#0078d4]" />,
        action: () => {
          window.open('https://t.me/thedeluxstorebot', '_blank');
          onClose();
        },
        keywords: ['telegram', 'bot', 'open', 'channel', 'chat'],
      },
      {
        id: 'action-audit-logs',
        category: 'Actions',
        title: 'View Security Audit Trails',
        subtitle: 'Inspect operator login sessions and cryptographic changes',
        icon: <Shield className="h-4 w-4 text-[#605e5c]" />,
        action: () => {
          router.push('/settings');
          onClose();
        },
        keywords: ['audit', 'security', 'logs', 'trails', 'history'],
      },
    ],
    [router, onClose]
  );

  // Dynamically constructed items for live entities (products, customers, orders)
  const dynamicItems: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // Products
    products.slice(0, 15).forEach((p) => {
      list.push({
        id: `prod-${p.id}`,
        category: 'Products',
        title: p.name,
        subtitle: `SKU: ${p.sku} • Stock: ${p.availableStock ?? 0} units available`,
        badge: `$${Number(p.normalPrice || 0).toFixed(2)}`,
        badgeColor: 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]',
        icon: <Package className="h-4 w-4 text-[#0078d4]" />,
        action: () => {
          router.push('/products');
          onClose();
        },
        keywords: [p.name, p.sku, p.category?.name || ''],
      });
    });

    // Customers
    customers.slice(0, 15).forEach((c) => {
      const username = c.telegramUsername ? `@${c.telegramUsername}` : '';
      const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer';
      list.push({
        id: `cust-${c.id}`,
        category: 'Customers',
        title: `${name} ${username}`,
        subtitle: `Telegram ID: ${c.telegramUserId} • Total Spent: $${Number(c.wallet?.totalSpent ?? 0).toFixed(2)}`,
        badge: `$${Number(c.wallet?.cachedBalance ?? 0).toFixed(2)} Balance`,
        badgeColor: 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]',
        icon: <Users className="h-4 w-4 text-[#107c10]" />,
        action: () => {
          router.push('/customers');
          onClose();
        },
        keywords: [name, username, c.telegramUserId],
      });
    });

    // Orders
    orders.slice(0, 15).forEach((o) => {
      const customer = o.user?.telegramUsername ? `@${o.user.telegramUsername}` : o.user?.firstName || 'Buyer';
      list.push({
        id: `ord-${o.id}`,
        category: 'Orders',
        title: `Order #${o.orderNumber || o.id.slice(0, 8)}`,
        subtitle: `Customer: ${customer} • ${o.product?.name || 'Digital Item'}`,
        badge: o.status || 'PAID',
        badgeColor:
          o.status === 'DELIVERED'
            ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
            : 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc]',
        icon: <ShoppingBag className="h-4 w-4 text-[#8a3707]" />,
        action: () => {
          router.push('/orders');
          onClose();
        },
        keywords: [o.orderNumber || '', customer, o.status || ''],
      });
    });

    return list;
  }, [products, customers, orders, router, onClose]);

  // Combine and filter by user query
  const filteredItems = useMemo(() => {
    const all = [...staticItems, ...dynamicItems];
    const q = query.trim().toLowerCase();
    if (!q) {
      // When empty query, return top curated navigation and actions
      return staticItems;
    }

    return all.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle ? item.subtitle.toLowerCase().includes(q) : false;
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [staticItems, dynamicItems, query]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Flat list for keyboard index selection
  const flatItems = useMemo(() => {
    const list: CommandItem[] = [];
    Object.values(groupedItems).forEach((items) => list.push(...items));
    return list;
  }, [groupedItems]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 >= flatItems.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 < 0 ? flatItems.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Ensure selected index is valid
  useEffect(() => {
    if (selectedIndex >= flatItems.length) {
      setSelectedIndex(0);
    }
  }, [flatItems, selectedIndex]);

  // Auto scroll into view for active item
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen || !mounted) return null;

  let currentIndexCounter = 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-black/55 backdrop-blur-xs select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-[8px] shadow-2xl border border-[#edebe9] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 divide-y divide-[#edebe9]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Header */}
        <div className="flex items-center px-4 py-3 gap-3 bg-[#faf9f8]">
          <Search className="h-5 w-5 text-[#0078d4] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, product, customer username, or order #..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-[#201f1e] placeholder-[#8a8886] focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-[4px] hover:bg-[#edebe9] text-[#605e5c] transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[11px] font-mono text-[#8a8886] bg-white border border-[#d2d0ce] px-1.5 py-0.5 rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Scrollable Results List */}
        <div
          ref={listRef}
          className="max-h-[60vh] sm:max-h-[460px] overflow-y-auto p-2 space-y-3 thin-scrollbar"
        >
          {flatItems.length > 0 ? (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="space-y-1">
                {/* Category Header */}
                <div className="px-2.5 pt-1 text-[10px] font-bold text-[#8a8886] uppercase tracking-wider">
                  {category}
                </div>

                {/* Items */}
                {items.map((item) => {
                  const thisIndex = currentIndexCounter++;
                  const isSelected = thisIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      data-index={thisIndex}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(thisIndex)}
                      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-[6px] transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] shadow-2xs'
                          : 'border border-transparent hover:bg-[#faf9f8] text-[#201f1e]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`p-1.5 rounded-[4px] shrink-0 ${
                            isSelected ? 'bg-white shadow-2xs' : 'bg-[#f3f2f1]'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold truncate ${
                                isSelected ? 'text-[#0078d4]' : 'text-[#201f1e]'
                              }`}
                            >
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                                  item.badgeColor || 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="text-[11px] text-[#605e5c] truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right shortcut or return icon */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isSelected ? (
                          <div className="flex items-center gap-1 text-[11px] text-[#0078d4] font-medium animate-in fade-in">
                            <span className="hidden sm:inline">Select</span>
                            <CornerDownLeft className="h-3 w-3" />
                          </div>
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 text-[#c8c6c4]" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-[#f3f2f1] flex items-center justify-center text-[#605e5c]">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[#201f1e]">No matching items found</p>
              <p className="text-xs text-[#8a8886] max-w-xs mx-auto">
                No commands, products, or customer identities matched &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-[#faf9f8] flex items-center justify-between text-[11px] text-[#8a8886]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#d2d0ce] px-1 rounded text-[10px]">↑</kbd>
              <kbd className="font-mono bg-white border border-[#d2d0ce] px-1 rounded text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#d2d0ce] px-1 rounded text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-white border border-[#d2d0ce] px-1 rounded text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[#0078d4] font-medium">
            <span>Delux Enterprise Omnisearch</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
