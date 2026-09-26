'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  UserCheck,
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { toggleMobileMenu } = useNavigation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
    // Poll every 15 seconds for incoming customer orders, deposits, and tickets
    const timer = setInterval(loadNotifications, 15000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const cleaned = name.replace(/[^\w\s]/g, '').trim();
      const parts = cleaned.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
      if (parts.length === 1) return parts[0][0].toUpperCase();
    }
    if (email) {
      const username = email.split('@')[0].replace(/[^\w\s]/g, '');
      return username.slice(0, 2).toUpperCase();
    }
    return 'MS';
  };

  const activeNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const unreadCount = activeNotifications.length;

  const markAllAsRead = () => {
    const allIds = new Set([...Array.from(dismissedIds), ...notifications.map((n) => n.id)]);
    setDismissedIds(allIds);
  };

  const handleItemClick = (link: string, id: string) => {
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
    <header className="h-16 bg-white border-b border-[#edebe9] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-[6px] text-[#605e5c] hover:text-[#201f1e] hover:bg-[#f3f2f1] transition -ml-1 shrink-0 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile Brand Emblem */}
        <div className="lg:hidden flex items-center gap-1.5 shrink-0">
          <div className="h-7 w-7 rounded-[6px] bg-[#051329] border border-[#0078d4]/30 overflow-hidden shadow-xs p-[1px]">
            <img src="/icons/icon-192.png" alt="Delux Store" className="h-full w-full object-cover rounded-[5px]" />
          </div>
        </div>

        {/* Restructured Clean Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search orders, customers, TxIDs..."
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[6px] pl-9 pr-12 py-1.5 text-xs text-[#1e293b] placeholder-[#94a3b8] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition shadow-2xs"
          />
          <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#94a3b8] bg-white border border-[#e2e8f0] px-1.5 py-0.5 rounded-[4px] shadow-2xs">
            ⌘K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-[6px] transition-all border cursor-pointer ${
              isOpen
                ? 'bg-[#eff6fc] border-[#c7e0f4] text-[#0078d4]'
                : 'border-transparent text-[#605e5c] hover:text-[#201f1e] hover:bg-[#f3f2f1]'
            }`}
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ef4444] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Microsoft Fluent Light Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white border border-[#edebe9] rounded-[6px] shadow-fluentModal z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
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

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-[#edebe9]">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n.link, n.id)}
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

              {/* Footer */}
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

        {/* Clean Divider */}
        <div className="h-5 w-[1px] bg-[#e2e8f0]" />

        {/* Executive User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-2.5 px-2 py-1 rounded-[6px] transition-all border cursor-pointer ${
              isProfileOpen
                ? 'bg-[#eff6fc] border-[#c7e0f4] shadow-2xs'
                : 'border-transparent hover:bg-[#faf9f8] hover:border-[#edebe9]'
            }`}
          >
            {/* Sleek Executive Dark Avatar */}
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#334155] text-white flex items-center justify-center font-bold text-[11px] shadow-2xs tracking-wider ring-1 ring-slate-900/10 shrink-0">
              {getInitials(user?.name, user?.email)}
            </div>

            {/* User Name with Chevron beside it - NO OWNER text below */}
            <div className="hidden sm:flex items-center gap-1.5 text-left">
              <span className="text-xs font-semibold text-[#1e293b] tracking-tight">
                {user?.name || user?.email?.split('@')[0] || 'Admin'}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#8a8886] transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180 text-[#0f172a]' : ''
                }`}
              />
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-[8px] shadow-fluentModal border border-[#edebe9] z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden divide-y divide-[#edebe9]">
              {/* Profile Card Header */}
              <div className="p-3.5 bg-gradient-to-b from-[#faf9f8] to-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0078d4] bg-gradient-to-br from-[#0078d4] to-[#004e8c] text-white flex items-center justify-center font-bold text-xs shadow-sm tracking-wider shrink-0 ring-2 ring-[#c7e0f4]/50">
                    {getInitials(user?.name, user?.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#201f1e] truncate">
                        {user?.name || user?.email?.split('@')[0] || 'Administrator'}
                      </p>
                    </div>
                    <p className="text-[11px] text-[#605e5c] truncate mt-0.5">
                      {user?.email || 'admin@deluxstore.com'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-1.5 py-0.2 rounded-[2px] bg-[#eff6fc] border border-[#c7e0f4] text-[#0078d4] text-[9px] font-bold uppercase tracking-wider">
                        {user?.roles?.[0] || 'OWNER'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-[#107c10]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#107c10]" />
                        Active Session
                      </span>
                    </div>
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
                    <span className="block text-[10px] text-[#8a8886] font-normal">Branding, wallets & rules</span>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium text-[#201f1e] hover:bg-[#f3f2f1] transition text-left"
                >
                  <Users className="h-4 w-4 text-[#107c10]" />
                  <div className="flex-1">
                    <span className="font-semibold">Team Members & Staff</span>
                    <span className="block text-[10px] text-[#8a8886] font-normal">Manage friend accounts</span>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium text-[#201f1e] hover:bg-[#f3f2f1] transition text-left"
                >
                  <Bot className="h-4 w-4 text-[#8a3707]" />
                  <div className="flex-1">
                    <span className="font-semibold">Store & Bot Fleet</span>
                    <span className="block text-[10px] text-[#8a8886] font-normal">Tokens & bot runners</span>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-medium text-[#201f1e] hover:bg-[#f3f2f1] transition text-left"
                >
                  <Shield className="h-4 w-4 text-[#605e5c]" />
                  <div className="flex-1">
                    <span className="font-semibold">Security & Audit Logs</span>
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-xs font-semibold text-[#d13438] hover:bg-[#fde7e9] transition text-left"
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
    </header>
  );
}
