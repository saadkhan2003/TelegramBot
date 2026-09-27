'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore, Store } from '../context/StoreContext';
import {
  Store as StoreIcon,
  ChevronsUpDown,
  Check,
  Plus,
  Bot,
  ExternalLink,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';

export default function StoreSwitcher() {
  const { stores, activeStore, setActiveStore, createStore, loading } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // New Store Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCurrency, setNewStoreCurrency] = useState('USD');
  const [newStoreBotToken, setNewStoreBotToken] = useState('');
  const [creating, setCreating] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectStore = (store: Store) => {
    setActiveStore(store);
    setIsOpen(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setCreating(true);
    try {
      await createStore({
        name: newStoreName.trim(),
        currency: newStoreCurrency,
        botToken: newStoreBotToken.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewStoreName('');
      setNewStoreBotToken('');
      setIsOpen(false);
    } catch (err: any) {
      alert(`Failed to create store: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Store Switcher Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-[6px] hover:bg-[#edebe9]/60 transition text-left group"
        title="Switch active store / bot fleet"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-8 w-8 rounded-[7px] p-[1px] shadow-sm flex items-center justify-center shrink-0 border border-[#0078d4]/30 bg-[#051329] overflow-hidden">
            <img
              src="/icons/icon-192.png"
              alt="Delux Store"
              className="h-full w-full object-cover rounded-[6px]"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#201f1e] truncate tracking-tight">
                {activeStore ? activeStore.name : 'Delux Store'}
              </span>
              <span className="px-1.5 py-0.2 text-[8px] font-bold bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] rounded-[2px] uppercase tracking-wide">
                {activeStore?.currency || 'USD'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  activeStore?.hasBotToken ? 'bg-[#107c10]' : 'bg-[#f7630c]'
                }`}
              />
              <span className="text-[10px] text-[#605e5c] truncate">
                {activeStore?.botUsername
                  ? `@${activeStore.botUsername}`
                  : activeStore?.hasBotToken
                  ? 'Bot Connected'
                  : 'No Bot Token'}
              </span>
            </div>
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-[#8a8886] group-hover:text-[#201f1e] transition shrink-0 ml-1" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-[#edebe9] rounded-[6px] shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[#8a8886] uppercase tracking-wider border-b border-[#f3f2f1]">
            Your Store & Bot Fleet ({stores.length})
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {stores.map((s) => {
              const isActive = activeStore?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectStore(s)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition text-left ${
                    isActive ? 'bg-[#eff6fc] text-[#0078d4]' : 'hover:bg-[#faf9f8] text-[#201f1e]'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">{s.name}</span>
                      <span className="text-[9px] px-1 bg-[#f3f2f1] text-[#605e5c] rounded">
                        {s.currency}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#605e5c] truncate flex items-center gap-1 mt-0.5">
                      <Bot className="h-3 w-3 text-[#8a8886]" />
                      <span>{s.botUsername ? `@${s.botUsername}` : s.hasBotToken ? 'Connected' : 'No bot'}</span>
                    </p>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-[#0078d4] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Create New Store Action */}
          <div className="border-t border-[#f3f2f1] pt-1 px-1">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0078d4] hover:bg-[#eff6fc] rounded-[4px] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Store / Connect Bot</span>
            </button>
          </div>
        </div>
      )}

      {/* Create New Store Modal — Portaled to document.body so it is never trapped inside transformed sidebar */}
      {showCreateModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white border border-[#edebe9] rounded-lg p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-[#1b1a19]"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
            }}
          >
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1b1a19]">Create New Store &amp; Bot Tenant</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  Set up a separate store for your friend or new product category.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-sm hover:bg-[#f3f2f1] text-[#737373] hover:text-[#1b1a19] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[#1b1a19] block mb-1 font-semibold">Store Name</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Ahmed Digital Emporium"
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#1b1a19] focus:bg-white focus:outline-none focus:border-[#0078d4] transition"
                />
              </div>

              <div>
                <label className="text-[#1b1a19] block mb-1 font-semibold">Base Currency</label>
                <SearchableSelect
                  value={newStoreCurrency}
                  onChange={setNewStoreCurrency}
                  options={[
                    { value: 'USD', label: 'USD ($) — Global Digital Currencies', badge: 'USD' },
                    { value: 'PKR', label: 'PKR (Rs) — Pakistan Local Rupee', badge: 'PKR' },
                  ]}
                  searchable={false}
                  className="w-full py-2"
                  menuClassName="w-full"
                />
              </div>

              <div>
                <label className="text-[#1b1a19] block mb-1 font-semibold flex items-center justify-between">
                  <span>Telegram Bot Token</span>
                  <span className="text-[10px] text-[#605e5c] font-normal">Optional (can add later)</span>
                </label>
                <input
                  type="text"
                  value={newStoreBotToken}
                  onChange={(e) => setNewStoreBotToken(e.target.value)}
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#1b1a19] focus:bg-white focus:outline-none focus:border-[#0078d4] font-mono transition"
                />
                <p className="text-[10px] text-[#605e5c] mt-1">
                  Obtain your Bot Token from @BotFather on Telegram.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-[4px] border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#605e5c] font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
