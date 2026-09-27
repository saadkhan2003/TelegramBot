'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  ArrowDownCircle,
  Users,
  Wallet,
  LifeBuoy,
  Settings,
  ShieldCheck,
  ChevronsUpDown,
  UserCheck,
  X,
  LogOut,
  Server,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import StoreSwitcher from './StoreSwitcher';
import AboutStackAndScaleModal from './AboutStackAndScaleModal';
import { Avatar } from './Avatar';

const navigationGroups = [
  {
    title: 'Core Operations',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Products Catalog', href: '/products', icon: Package },
      { name: 'Inventory & Stock', href: '/inventory', icon: Layers },
      { name: 'Orders Management', href: '/orders', icon: ShoppingBag },
    ],
  },
  {
    title: 'Finance & Treasury',
    items: [
      { name: 'Deposits & Payments', href: '/deposits', icon: ArrowDownCircle },
      { name: 'Wallets & Ledger', href: '/wallets', icon: Wallet },
    ],
  },
  {
    title: 'Customer & Admin',
    items: [
      { name: 'Customers & Users', href: '/customers', icon: Users },
      { name: 'Support & Claims', href: '/support', icon: LifeBuoy },
      { name: 'System Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMobileMenuOpen, closeMobileMenu } = useNavigation();
  const { user, logout } = useAuth();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Responsive Sidebar */}
      <aside
        className={`w-72 sm:w-64 bg-white border-r border-[#edebe9] flex flex-col h-[100dvh] max-h-[100dvh] fixed left-0 top-0 z-50 lg:z-20 select-none transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 shadow-xs'
        }`}
      >
        {/* Brand Header: Enterprise Tenant Row with Store Switcher */}
        <div className="h-16 flex items-center px-2.5 border-b border-[#edebe9] bg-[#faf9f8] justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <StoreSwitcher />
          </div>
          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-1.5 rounded-[4px] text-[#605e5c] hover:text-[#201f1e] hover:bg-[#edebe9] transition ml-1 shrink-0 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Container covering Navigation + Footer Cards */}
        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col justify-between divide-y divide-[#edebe9] thin-scrollbar">
          {/* Grouped Enterprise Navigation */}
          <nav className="p-3 space-y-4">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-0.5">
                <div className="px-3 pb-1 text-[10px] font-bold text-[#8a8886] uppercase tracking-wider">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[4px] transition-all relative ${
                          isActive
                            ? 'bg-[#eff6fc] text-[#0078d4] font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-[#0078d4] before:rounded-r-[2px]'
                            : 'text-[#605e5c] hover:text-[#201f1e] hover:bg-[#f3f2f1]'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#0078d4]' : 'text-[#8a8886]'}`} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer Cards Container (Stack & Scale About + User Profile Row) */}
          <div className="shrink-0 bg-[#faf9f8] divide-y divide-[#edebe9] pb-8 lg:pb-3">
            {/* Stack & Scale Sovereign Software About Card */}
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  setIsAboutModalOpen(true);
                }}
                className="w-full text-left p-2.5 rounded-lg border border-[#edebe9] bg-white hover:bg-[#f3f2f1] hover:border-[#d2d0ce] transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="8" y="72" width="48" height="12" rx="3.5" fill="#1b1a19" fillOpacity="0.25" />
                      <rect x="26" y="47" width="48" height="13" rx="3.5" fill="#1b1a19" fillOpacity="0.55" />
                      <rect x="44" y="22" width="48" height="14" rx="3.5" fill="#1b1a19" />
                    </svg>
                    <span className="font-bold text-xs text-[#1b1a19] group-hover:text-[#0078d4] transition-colors">Stack &amp; Scale</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#605e5c] group-hover:text-[#1b1a19] group-hover:underline">About</span>
                </div>
                <p className="mt-1 text-[11px] text-[#605e5c] truncate">Sovereign Software &amp; Enterprise Systems</p>
              </button>
            </div>

            {/* User / Operator Row */}
            <div className="p-3">
              <div className="p-2.5 rounded-[6px] bg-white border border-[#edebe9] shadow-2xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={user?.name}
                    email={user?.email}
                    size="md"
                    showOnline={true}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#201f1e] truncate" title={user?.name || user?.email || 'Admin'}>
                      {user?.name || user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-[10px] text-[#605e5c] truncate mt-0.5" title={user?.email || ''}>
                      {user?.email || 'admin@deluxstore.com'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] border border-[#edebe9] bg-[#faf9f8] hover:bg-[#fde7e9] hover:border-[#f8d2d4] text-[#605e5c] hover:text-[#d13438] text-[11px] font-medium transition cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* About Stack & Scale Modal */}
      <AboutStackAndScaleModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </>
  );
}
