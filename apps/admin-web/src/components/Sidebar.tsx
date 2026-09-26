'use client';

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
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import StoreSwitcher from './StoreSwitcher';

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
        className={`w-72 sm:w-64 bg-white border-r border-[#edebe9] flex flex-col h-screen fixed left-0 top-0 z-50 lg:z-20 select-none transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 shadow-xs'
        }`}
      >
        {/* Brand Header: Enterprise Tenant Row with Store Switcher */}
        <div className="h-16 flex items-center px-2.5 border-b border-[#edebe9] bg-[#faf9f8] justify-between">
          <div className="flex-1 min-w-0">
            <StoreSwitcher />
          </div>
          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-1.5 rounded-[4px] text-[#605e5c] hover:text-[#201f1e] hover:bg-[#edebe9] transition ml-1 shrink-0"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grouped Enterprise Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
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

        {/* User / Operator Row: Structured Enterprise Identity Card */}
        <div className="p-3 border-t border-[#edebe9] bg-[#faf9f8]">
          <div className="p-2.5 rounded-[6px] bg-white border border-[#edebe9] shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="h-8 w-8 rounded-full bg-linear-to-br from-[#0078d4] to-[#004e8c] text-white flex items-center justify-center font-bold text-[11px] tracking-wider shadow-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#107c10] border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-[#201f1e] truncate" title={user?.name || user?.email || 'Admin'}>
                    {user?.name || user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] rounded-[2px] uppercase shrink-0">
                    {user?.roles?.[0] || 'OWNER'}
                  </span>
                </div>
                <p className="text-[10px] text-[#605e5c] truncate mt-0.5" title={user?.email || ''}>
                  {user?.email || 'admin@deluxstore.com'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] border border-[#edebe9] bg-[#faf9f8] hover:bg-[#fde7e9] hover:border-[#f8d2d4] text-[#605e5c] hover:text-[#d13438] text-[11px] font-medium transition"
            >
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
