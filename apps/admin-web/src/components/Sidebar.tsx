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
  ShieldAlert,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Inventory & Stock', href: '/inventory', icon: Layers },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Deposits', href: '/deposits', icon: ArrowDownCircle },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Wallets & Ledger', href: '/wallets', icon: Wallet },
  { name: 'Support & Claims', href: '/support', icon: LifeBuoy },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
          ⚡
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide text-white">Apex Store</h1>
          <p className="text-[11px] text-slate-400">Telegram Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
          AD
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">admin@store.local</p>
          <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded">
            OWNER
          </span>
        </div>
      </div>
    </aside>
  );
}
