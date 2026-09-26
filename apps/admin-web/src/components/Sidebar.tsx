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
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

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
      { name: 'Crypto Deposits', href: '/deposits', icon: ArrowDownCircle },
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
        {/* Brand Header: Enterprise Tenant Row */}
        <div className="h-16 flex items-center px-4 border-b border-[#edebe9] bg-[#faf9f8] justify-between group hover:bg-[#f3f2f1] transition">
          <div className="flex items-center gap-3 min-w-0">
            {/* Enterprise Architectural Vector Mark */}
            <div className="relative h-9 w-9 rounded-[6px] bg-gradient-to-tr from-[#004b87] via-[#0078d4] to-[#2b88d8] p-[1px] shadow-xs flex items-center justify-center shrink-0 border border-[#005a9e]/30">
              <div className="h-full w-full bg-[#002447] rounded-[5px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0078d4]/30 via-transparent to-[#004e8c]/50" />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-5 w-5 text-white relative z-10"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.2)" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#201f1e] truncate tracking-tight">Delux Store</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] rounded-[2px] uppercase tracking-wide">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#107c10] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#107c10]" />
                </span>
                <span className="text-[11px] text-[#605e5c] truncate">Bot Engine Live</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ChevronsUpDown className="hidden sm:block h-3.5 w-3.5 text-[#8a8886] group-hover:text-[#201f1e] shrink-0 transition" />
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-1.5 rounded-[4px] text-[#605e5c] hover:text-[#201f1e] hover:bg-[#edebe9] transition"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
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
          <div className="p-2.5 rounded-[4px] bg-white border border-[#edebe9] shadow-2xs space-y-2">
            {/* Top row: Avatar + Name + Admin Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <div className="h-7 w-7 rounded-[4px] bg-[#eff6fc] border border-[#c7e0f4] flex items-center justify-center text-[#0078d4]">
                    <UserCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#107c10] border-2 border-white" />
                </div>
                <p className="text-xs font-bold text-[#201f1e] truncate">M. Saad</p>
              </div>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] rounded-[2px] shrink-0">
                <ShieldCheck className="h-2.5 w-2.5" />
                ADMIN
              </span>
            </div>

            {/* Bottom row: Account email and status */}
            <div className="flex items-center justify-between text-[10px] text-[#605e5c] pt-1.5 border-t border-[#f3f2f1]">
              <span className="truncate max-w-[145px]" title="msaad.official6@gmail.com">
                msaad.official6@gmail.com
              </span>
              <span className="text-[#107c10] font-semibold shrink-0 flex items-center gap-1 text-[9px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#107c10]" />
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
