'use client';

import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search orders, customers, TxIDs (e.g. ORD-2026...)"
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500"></span>
        </button>

        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-400 font-medium">Production Online</span>
        </div>
      </div>
    </header>
  );
}
