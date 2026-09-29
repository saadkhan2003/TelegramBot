'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  ShoppingBag,
  ArrowDownCircle,
  MessageSquare,
  ShieldAlert,
  CheckCheck,
  Check,
  X,
  Menu,
  LogOut,
  ChevronDown,
  Settings,
  Users,
  Bot,
  Shield,
  Plus,
  Package,
  Layers,
  ExternalLink,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { CommandPalette } from './CommandPalette';

const routeDetails: Record<string, { section: string; title: string }> = {
  '/': { section: 'Overview', title: 'Dashboard' },
  '/products': { section: 'Operations', title: 'Products Catalog' },
  '/inventory': { section: 'Operations', title: 'Inventory & Stock' },
  '/orders': { section: 'Operations', title: 'Orders Management' },
  '/deposits': { section: 'Treasury', title: 'Deposits & Payments' },
  '/wallets': { section: 'Treasury', title: 'Wallets & Ledger' },
  '/customers': { section: 'Directory', title: 'Customer Accounts' },
  '/support': { section: 'Helpdesk', title: 'Support & Claims' },
  '/settings': { section: 'System', title: 'Store Settings' },
  '/stack-and-scale': { section: 'Engineering', title: 'Stack & Scale' },
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleMobileMenu, isSidebarCollapsed, toggleSidebarCollapse } = useNavigation();
  const { user, logout } = useAuth();

  // Dropdown & Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Refs for outside click handling
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);

  // Get current breadcrumb info
  const currentRoute = routeDetails[pathname] || {
    section: 'Store',
    title: pathname.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Dashboard',
  };

  const loadNotifications = () => {
    fetchApi('/admin/notifications')
      .then((res) => {
        if (res?.notifications) {
          setNotifications(res.notifications);
        }
      })
      .catch((e) => console.error('Failed to load notifications:', e));
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(target)) {
        setIsQuickActionOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = activeNotifications.length;

  const markAllAsRead = () => {
    const allIds = new Set([...Array.from(dismissedIds), ...notifications.map((n) => n.id)]);
    setDismissedIds(allIds);
  };

  const handleNotificationClick = (link: string, id: string) => {
    setDismissedIds((prev) => new Set([...Array.from(prev), id]));
    setIsOpen(false);
    router.push(link);
  };



  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PROCESSING':
        return <ShoppingBag className="h-4 w-4 text-[#0078d4]" />;
      case 'DEPOSIT_REVIEW':
        return <ArrowDownCircle className="h-4 w-4 text-[#107c10]" />;
      case 'SUPPORT_TICKET':
        return <MessageSquare className="h-4 w-4 text-[#8a3707]" />;
      case 'WARRANTY_CLAIM':
        return <ShieldAlert className="h-4 w-4 text-[#d13438]" />;
      default:
        return <Bell className="h-4 w-4 text-[#0078d4]" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] flex items-center justify-between px-2.5 sm:px-6 sticky top-0 z-30 shadow-2xs select-none gap-1.5 sm:gap-3">
      {/* 1. Left Section: Breadcrumb & Context Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-1.5 rounded-[5px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Brand Emblem */}
        <div className="lg:hidden flex items-center gap-1 shrink-0">
          <div className="h-6 w-6 rounded-[5px] bg-[#051329] border border-[#0078d4]/30 overflow-hidden shadow-xs p-[1px]">
            <img src="/icons/icon-192.png" alt="Delux Store" className="h-full w-full object-cover rounded-[4px]" />
          </div>
        </div>

        {/* Mobile Current Page Title */}
        <span className="sm:hidden text-xs font-bold text-[#0f172a] truncate max-w-[85px] xs:max-w-[125px]">
          {currentRoute.title}
        </span>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-1.5 rounded-[5px] text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition cursor-pointer"
          title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label="Toggle sidebar"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Desktop Breadcrumb Hierarchy */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <Link
            href="/"
            className="font-semibold text-[#0f172a] hover:text-[#0078d4] transition flex items-center gap-1.5"
          >
            <span>Delux Store</span>
          </Link>
          <span className="text-[#cbd5e1] font-normal">/</span>
          <span className="font-semibold text-[#1e293b]">{currentRoute.title}</span>
        </div>
      </div>

      {/* 2. Center Section: Executive Command Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg min-w-0 mx-1 sm:mx-4">
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-[6px] px-2.5 sm:pl-3.5 sm:pr-2.5 py-1.5 text-xs text-[#64748b] hover:text-[#0f172a] flex items-center justify-between transition shadow-2xs group cursor-pointer text-left"
          title="Open Omnisearch & Command Palette (Ctrl+K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-3.5 w-3.5 text-[#94a3b8] group-hover:text-[#0078d4] transition shrink-0" />
            <span className="truncate text-xs font-normal sm:hidden">Search...</span>
            <span className="truncate text-xs font-normal hidden sm:inline">Search orders, customers, inventory, commands...</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
            <kbd className="inline-flex items-center gap-0.5 text-[10px] font-mono text-[#94a3b8] bg-white border border-[#e2e8f0] group-hover:border-[#cbd5e1] px-1.5 py-0.5 rounded shadow-2xs transition">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* 3. Right Section: Quick Action, Bot Status, Notifications & Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Quick Action Button */}
        <div className="relative" ref={quickActionRef}>
          <button
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] bg-[#eff6fc] hover:bg-[#dbeafe] text-[#0078d4] border border-[#c7e0f4] text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {isQuickActionOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-[6px] shadow-fluentModal border border-[#edebe9] z-50 p-1.5 space-y-0.5 animate-in fade-in duration-100 divide-y divide-[#edebe9]">
              <div className="space-y-0.5">
                <Link
                  href="/products"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#201f1e] hover:bg-[#f3f2f1] transition font-medium"
                >
                  <Package className="h-3.5 w-3.5 text-[#0078d4]" />
                  <span>New Product SKU</span>
                </Link>
                <Link
                  href="/inventory"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#201f1e] hover:bg-[#f3f2f1] transition font-medium"
                >
                  <Layers className="h-3.5 w-3.5 text-[#107c10]" />
                  <span>Import Stock Batch</span>
                </Link>
                <Link
                  href="/deposits"
                  onClick={() => setIsQuickActionOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#201f1e] hover:bg-[#f3f2f1] transition font-medium"
                >
                  <ArrowDownCircle className="h-3.5 w-3.5 text-[#8a3707]" />
                  <span>Review Deposits</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Telegram Bot Live Fleet Status */}
        <a
          href="https://t.me/thedeluxstorebot"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-[5px] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-xs transition shadow-2xs"
          title="Direct link to customer Telegram Bot"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] text-[#0f172a] font-medium">@thedeluxstorebot</span>
          <ExternalLink className="h-3 w-3 text-[#94a3b8]" />
        </a>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-[6px] transition-all border cursor-pointer ${
              isOpen
                ? 'bg-[#eff6fc] border-[#c7e0f4] text-[#0078d4]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
            }`}
            title="System Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ef4444] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isOpen && (
            <div className="fixed inset-x-3 top-16 sm:inset-x-auto sm:right-6 sm:top-full sm:mt-2 sm:w-96 max-w-sm sm:max-w-none ml-auto bg-white border border-[#edebe9] rounded-[8px] shadow-fluentModal z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100dvh-5rem)]">
              <div className="px-4 py-3 border-b border-[#edebe9] bg-[#faf9f8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#201f1e]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] px-1.5 py-0.2 rounded-[2px]">
                      {unreadCount} pending
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-[#0078d4] hover:text-[#106ebe] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#edebe9] thin-scrollbar">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.link, n.id)}
                      className="p-3.5 hover:bg-[#faf9f8] transition cursor-pointer flex items-start gap-3 group"
                    >
                      <div className="p-2 rounded-[4px] bg-[#f3f2f1] border border-[#edebe9] shrink-0 mt-0.5 group-hover:border-[#c7e0f4] group-hover:bg-[#eff6fc] transition">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-semibold text-[#201f1e] truncate group-hover:text-[#0078d4]">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-[#8a8886] shrink-0">
                            {formatTime(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#605e5c] line-clamp-2 leading-relaxed">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 px-4 text-center">
                    <div className="h-10 w-10 mx-auto rounded-full bg-[#dff6dd] border border-[#a8e5a3] text-[#107c10] flex items-center justify-center mb-2">
                      <Check className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-[#201f1e]">All Caught Up!</p>
                    <p className="text-[11px] text-[#8a8886] mt-0.5">
                      No pending orders, deposits, or support tickets requiring attention.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 border-t border-[#edebe9] bg-[#faf9f8] flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/orders');
                  }}
                  className="text-[#0078d4] hover:text-[#106ebe] font-medium cursor-pointer"
                >
                  View Orders Queue →
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#8a8886] hover:text-[#201f1e] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clean Hairline Vertical Divider */}
        <div className="hidden sm:block h-5 w-[1px] bg-[#e2e8f0]" />

        {/* Executive User Profile Pill Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-1 sm:pr-2 sm:py-1 rounded-[6px] transition-all border cursor-pointer ${
              isProfileOpen
                ? 'bg-[#eff6fc] border-[#c7e0f4] shadow-2xs'
                : 'border-transparent hover:bg-[#f8fafc] hover:border-[#e2e8f0]'
            }`}
          >
            {/* Notionist Face Avatar with Online Beacon */}
            <Avatar name={user?.name} email={user?.email} size="sm" showOnline={true} />

            {/* User Identity Label */}
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-[#0f172a] tracking-tight">
                {user?.name || user?.email?.split('@')[0] || 'Admin'}
              </span>
              <span className="text-[10px] font-medium text-[#64748b] mt-0.5">
                Store Owner
              </span>
            </div>

            <ChevronDown
              className={`hidden sm:block h-3.5 w-3.5 text-[#94a3b8] transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180 text-[#0f172a]' : ''
              }`}
            />
          </button>

          {isProfileOpen && (
            <div className="fixed right-3 top-16 w-[calc(100vw-1.5rem)] max-w-[280px] sm:max-w-none sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-72 bg-white rounded-[8px] shadow-fluentModal border border-[#edebe9] z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden divide-y divide-[#edebe9]">
              {/* Profile Card Header */}
              <div className="p-3.5 bg-gradient-to-b from-[#faf9f8] to-white">
                <div className="flex items-center gap-3">
                  <Avatar name={user?.name} email={user?.email} size="lg" showOnline={true} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#201f1e] truncate">
                      {user?.name || user?.email?.split('@')[0] || 'Administrator'}
                    </p>
                    <p className="text-[11px] text-[#605e5c] truncate mt-0.5">
                      {user?.email || 'admin@deluxstore.com'}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#107c10] mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#107c10]" />
                      Active Console Session
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Links */}
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium text-[#201f1e] hover:bg-[#f3f2f1] transition text-left"
                >
                  <Settings className="h-4 w-4 text-[#0078d4]" />
                  <div className="flex-1">
                    <span className="font-semibold">Store Configuration</span>
                    <span className="block text-[10px] text-[#8a8886] font-normal">Branding, wallets &amp; rules</span>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium text-[#201f1e] hover:bg-[#f3f2f1] transition text-left"
                >
                  <Users className="h-4 w-4 text-[#107c10]" />
                  <div className="flex-1">
                    <span className="font-semibold">Team Members &amp; Staff</span>
                    <span className="block text-[10px] text-[#8a8886] font-normal">Manage operator permissions</span>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium text-[#201f1e] hover:bg-[#f3f2f1] transition text-left"
                >
                  <Bot className="h-4 w-4 text-[#8a3707]" />
                  <div className="flex-1">
                    <span className="font-semibold">Store &amp; Bot Fleet</span>
                    <span className="block text-[10px] text-[#8a8886] font-normal">Tokens &amp; bot runners</span>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium text-[#201f1e] hover:bg-[#f3f2f1] transition text-left"
                >
                  <Shield className="h-4 w-4 text-[#605e5c]" />
                  <div className="flex-1">
                    <span className="font-semibold">Security &amp; Audit Logs</span>
                    <span className="block text-[10px] text-[#8a8886] font-normal">View admin session trails</span>
                  </div>
                </Link>
              </div>

              {/* Logout Action */}
              <div className="p-1.5 bg-[#faf9f8]">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-semibold text-[#d13438] hover:bg-[#fde7e9] transition text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <div className="flex-1">
                    <span>Sign Out of Console</span>
                    <span className="block text-[10px] text-[#a4262c]/80 font-normal">End your session securely</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Enterprise Omnisearch & Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </header>
  );
}
