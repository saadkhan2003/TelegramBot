'use client';

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
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useNavigation } from '../context/NavigationContext';

export default function Header() {
  const router = useRouter();
  const { toggleMobileMenu } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    <header className="h-16 bg-white border-b border-[#edebe9] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-[4px] text-[#605e5c] hover:text-[#201f1e] hover:bg-[#f3f2f1] transition -ml-1 shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
          <input
            type="text"
            placeholder="Search orders, customers, TxIDs..."
            className="w-full bg-[#f3f2f1] border border-[#d2d0ce] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
        {/* Production Online Beacon */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] bg-[#dff6dd]/60 border border-[#a8e5a3]/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#107c10] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#107c10]" />
          </span>
          <span className="hidden sm:inline text-[11px] font-semibold text-[#107c10]">Production Online</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-[4px] transition ${
              isOpen
                ? 'bg-[#eff6fc] text-[#0078d4]'
                : 'text-[#605e5c] hover:text-[#201f1e] hover:bg-[#f3f2f1]'
            }`}
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#d13438] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Microsoft Fluent Light Dropdown Popover */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white border border-[#edebe9] rounded-[4px] shadow-fluentModal z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
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
                    className="text-[11px] text-[#0078d4] hover:text-[#106ebe] font-medium flex items-center gap-1"
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
                  className="text-[#0078d4] hover:text-[#106ebe] font-medium"
                >
                  View Orders Queue →
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#8a8886] hover:text-[#201f1e]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Operational Status Indicator */}
        <div className="flex items-center gap-2 border-l border-[#edebe9] pl-4">
          <span className="inline-block h-2 w-2 rounded-full bg-[#107c10]"></span>
          <span className="text-xs text-[#605e5c] font-medium">Production Online</span>
        </div>
      </div>
    </header>
  );
}
