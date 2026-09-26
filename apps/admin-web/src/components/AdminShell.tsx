'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomBar from './MobileBottomBar';
import PwaProvider from './PwaProvider';
import { NavigationProvider } from '../context/NavigationContext';
import { Loader2 } from 'lucide-react';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Session verification loader
  if (loading && !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#051329]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-[12px] bg-[#051329] p-1 border border-[#0078d4]/40 flex items-center justify-center shadow-[0_0_25px_rgba(0,120,212,0.3)] animate-pulse">
            <img
              src="/icons/icon-192.png"
              alt="Delux Store"
              className="h-full w-full object-cover rounded-[10px]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#a19f9d]">
            <Loader2 className="h-4 w-4 animate-spin text-[#0078d4]" />
            <span>Verifying Encrypted Session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <NavigationProvider>
      <PwaProvider>
        <div className="flex min-h-screen w-full relative">
          <Sidebar />
          <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full pb-16 lg:pb-0">
            <Header />
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
          <MobileBottomBar />
        </div>
      </PwaProvider>
    </NavigationProvider>
  );
}
