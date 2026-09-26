'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Menu,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export default function MobileBottomBar() {
  const pathname = usePathname();
  const { toggleMobileMenu, isMobileMenuOpen } = useNavigation();

  const navItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Stock', href: '/inventory', icon: Layers },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-t border-[#edebe9] flex items-center justify-around px-1 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] select-none safe-area-pb"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[54px] transition-colors relative ${
              isActive ? 'text-[#0078d4]' : 'text-[#605e5c] hover:text-[#201f1e]'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-0.5 bg-[#0078d4] rounded-full" />
            )}
            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] font-medium tracking-tight mt-1">
              {item.name}
            </span>
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation drawer"
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[54px] transition-colors relative ${
          isMobileMenuOpen ? 'text-[#0078d4]' : 'text-[#605e5c] hover:text-[#201f1e]'
        }`}
      >
        {isMobileMenuOpen && (
          <span className="absolute top-0 w-8 h-0.5 bg-[#0078d4] rounded-full" />
        )}
        <div className="relative">
          <Menu className="h-5 w-5 stroke-[1.8]" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#107c10] ring-2 ring-white" />
        </div>
        <span className="text-[10px] font-medium tracking-tight mt-1">Menu</span>
      </button>
    </nav>
  );
}
