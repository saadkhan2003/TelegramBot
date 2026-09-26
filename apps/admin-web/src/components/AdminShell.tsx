'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomBar from './MobileBottomBar';
import PwaProvider from './PwaProvider';
import { StoreProvider } from '../context/StoreContext';
import { NavigationProvider } from '../context/NavigationContext';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Session verification loader: show while verifying or if not authenticated on a protected page
  if (loading || !user) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-between p-6 sm:p-10 relative select-none font-sans overflow-hidden"
        style={{
          backgroundColor: '#f2f4f8',
          backgroundImage: 'radial-gradient(#d0d7de 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          fontFamily: '"Segoe UI", "Segoe UI Variable Text", -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
        }}
      >
        {/* Microsoft Soft Ambient Blur Elements */}
        <div className="absolute top-1/6 left-1/4 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-[#0078d4]/8 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/6 right-1/4 w-72 sm:w-[450px] h-72 sm:h-[450px] bg-[#00a4ef]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Top Spacer */}
        <div className="flex-1" />

        {/* Main Floating Elevated Glass Card */}
        <div className="relative z-10 w-full max-w-sm mx-auto bg-white/95 backdrop-blur-xl border border-[#edebe9] rounded-2xl p-7 sm:p-8 shadow-[0_20px_50px_-12px_rgba(0,120,212,0.12),0_4px_16px_rgba(0,0,0,0.04)] flex flex-col items-center text-center transition-all animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle Top Accent Highlight Line */}
          <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-[#0078d4] to-transparent rounded-full" />

          {/* Animated Halo & Brand Icon */}
          <div className="relative my-2">
            {/* Concentric Pulse Rings */}
            <div className="absolute -inset-3 rounded-2xl bg-[#0078d4]/10 animate-pulse-ring pointer-events-none" />
            <div className="relative h-18 w-18 rounded-2xl bg-gradient-to-b from-[#eff6fc] to-[#e1effa] p-1 border border-[#c7e0f4] flex items-center justify-center shadow-md animate-float-gentle">
              <div className="h-full w-full rounded-xl bg-white p-1 border border-white/80 shadow-xs flex items-center justify-center overflow-hidden">
                <img
                  src="/icons/icon-192.png"
                  alt="Delux Store"
                  className="h-full w-full object-cover rounded-[8px]"
                />
              </div>

              {/* Live Signal Beacon Dot */}
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white flex items-center justify-center shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#107c10] animate-ping absolute" />
                <span className="h-2 w-2 rounded-full bg-[#107c10] relative" />
              </span>
            </div>
          </div>

          {/* Brand & State Copy */}
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-base font-bold tracking-tight text-[#1b1a19]">
                Delux Store
              </h2>
              <span className="text-[10px] font-mono font-semibold text-[#0078d4] bg-[#eff6fc] border border-[#c7e0f4] px-1.5 py-0.2 rounded">
                Console
              </span>
            </div>
            <p className="text-xs text-[#605e5c]">
              Verifying encrypted session &amp; security tokens
            </p>
          </div>

          {/* Microsoft Fluent Fluid Progress Bar */}
          <div className="w-56 h-1.5 bg-[#edebe9] rounded-full overflow-hidden relative mt-6 mb-3">
            <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-[#0078d4] via-[#00a4ef] to-[#0078d4] rounded-full animate-fluent-progress" />
          </div>

          {/* Step Loader Micro-copy */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0078d4]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0078d4]" />
            <span className="tracking-tight">Initializing secure workspace...</span>
          </div>

          {/* Security Trust Badge */}
          <div className="mt-6 pt-4 border-t border-[#edebe9] w-full flex items-center justify-center gap-1.5 text-[11px] text-[#605e5c]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#107c10]" />
            <span className="font-mono text-[10px]">TLS 1.3 · 256-Bit Sovereign Protocol</span>
          </div>
        </div>

        {/* Footer Attribution */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#8a8886]">
            <span>Engineered by</span>
            <span className="font-bold text-[#605e5c]">Stack &amp; Scale</span>
            <span>·</span>
            <span>99.999% SLA</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StoreProvider>
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
    </StoreProvider>
  );
}
