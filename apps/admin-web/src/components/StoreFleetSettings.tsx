'use client';

import React, { useState, useEffect } from 'react';
import { useStore, Store } from '../context/StoreContext';
import { fetchApi } from '../lib/api';
import {
  Bot,
  Store as StoreIcon,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Check,
  X,
} from 'lucide-react';

export default function StoreFleetSettings() {
  const { stores, activeStore, refreshStores, setActiveStore } = useStore();

  // Active Store Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [botToken, setBotToken] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [supportUsername, setSupportUsername] = useState('');
  const [showBotToken, setShowBotToken] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verifiedBot, setVerifiedBot] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (activeStore) {
      setName(activeStore.name || '');
      setTagline(activeStore.tagline || '');
      setCurrency(activeStore.currency || 'USD');
      setWelcomeMessage((activeStore as any).welcomeMessage || '');
      setSupportUsername((activeStore as any).supportUsername || '');
      setBotToken(''); // Don't expose full token unless editing
      setVerifiedBot(null);
    }
  }, [activeStore]);

  const handleVerifyToken = async () => {
    if (!botToken.trim()) {
      showToast('Please enter a Bot Token to test', 'error');
      return;
    }
    setVerifying(true);
    setVerifiedBot(null);
    try {
      const res = await fetchApi('/admin/stores/verify-token', {
        method: 'POST',
        body: JSON.stringify({ token: botToken.trim() }),
      });
      if (res.ok) {
        setVerifiedBot(res.bot);
        showToast(`✓ Valid! Bot connected: @${res.bot.username}`);
      } else {
        showToast(res.error || 'Invalid Bot Token', 'error');
      }
    } catch (err: any) {
      showToast(`Verification failed: ${err.message}`, 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveActiveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        tagline: tagline.trim(),
        currency,
        welcomeMessage: welcomeMessage.trim(),
        supportUsername: supportUsername.trim(),
      };
      if (botToken.trim()) {
        payload.botToken = botToken.trim();
      }

      await fetchApi(`/admin/stores/${activeStore.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      showToast('✓ Store & Bot configuration saved live!');
      await refreshStores();
      setBotToken('');
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-[4px] border border-[#edebe9] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#201f1e]">Multi-Bot Fleet & Tenant Stores</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4] rounded-[2px]">
              {stores.length} Active Stores
            </span>
          </div>
          <p className="text-xs text-[#605e5c] mt-1">
            Connect separate Telegram bot tokens for your friends and independent storefronts. Each store has its own products, orders, and bot personality.
          </p>
        </div>

        <button
          onClick={refreshStores}
          className="p-2 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#605e5c] transition"
          title="Refresh Fleet Status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Grid: Active Store Configuration + Fleet Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Store Settings Form */}
        <div className="lg:col-span-7 bg-white p-5 rounded-[4px] border border-[#edebe9] shadow-sm space-y-5">
          <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-[5px] bg-[#051329] p-1 border border-[#0078d4]/30 flex items-center justify-center">
                <StoreIcon className="h-4 w-4 text-[#0078d4]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#201f1e]">
                  Active Store: {activeStore?.name || 'Delux Store'}
                </h4>
                <p className="text-[10px] text-[#605e5c]">Slug: {activeStore?.slug}</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] border ${
                activeStore?.hasBotToken
                  ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                  : 'bg-[#fde7e9] text-[#d13438] border-[#f9a8ad]'
              }`}
            >
              {activeStore?.hasBotToken ? 'BOT ACTIVE' : 'NO TOKEN'}
            </span>
          </div>

          <form onSubmit={handleSaveActiveStore} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Store Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                >
                  <option value="USD">USD ($) — Global Standard</option>
                  <option value="PKR">PKR (Rs) — Pakistan Rupee</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[#201f1e] block mb-1 font-semibold">Tagline / Slogan</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Authorized Instant Digital Goods & Software"
                className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
              />
            </div>

            {/* Telegram Bot Token Input & Verifier */}
            <div className="p-3.5 rounded-[4px] bg-[#faf9f8] border border-[#0078d4]/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[#201f1e] font-semibold flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-[#0078d4]" />
                  <span>Telegram Bot Token (HTTP API)</span>
                </label>
                <span className="text-[10px] text-[#605e5c]">From @BotFather</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showBotToken ? 'text' : 'password'}
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder={
                      activeStore?.hasBotToken
                        ? '•••••••••••••••••••••••• (Configured & Live)'
                        : 'Enter bot token to connect...'
                    }
                    className="w-full bg-white border border-[#d2d0ce] rounded-[4px] pl-2.5 pr-8 py-2 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBotToken(!showBotToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8886] hover:text-[#201f1e]"
                  >
                    {showBotToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyToken}
                  disabled={verifying || !botToken.trim()}
                  className="px-3 py-2 bg-white border border-[#d2d0ce] hover:bg-[#eff6fc] text-[#0078d4] font-medium rounded-[4px] transition shrink-0 flex items-center gap-1.5 shadow-2xs"
                >
                  {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>Test Token</span>
                </button>
              </div>

              {/* Bot Verification Badge */}
              {verifiedBot && (
                <div className="p-2.5 rounded-[4px] bg-[#dff6dd] border border-[#a8e5a3] text-[#107c10] text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <div>
                    <strong>Verified Bot:</strong> @{verifiedBot.username} ({verifiedBot.firstName})
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[#201f1e] block mb-1 font-semibold">Welcome Message (/start text)</label>
              <textarea
                rows={2}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Welcome to our store! Fast, secure on-demand digital delivery."
                className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
              />
            </div>

            <div>
              <label className="text-[#201f1e] block mb-1 font-semibold">Support Username</label>
              <input
                type="text"
                value={supportUsername}
                onChange={(e) => setSupportUsername(e.target.value)}
                placeholder="e.g. @deluxsupport"
                className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-semibold text-xs shadow-xs transition flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Store Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Fleet Directory Card */}
        <div className="lg:col-span-5 bg-white p-5 rounded-[4px] border border-[#edebe9] shadow-sm space-y-4">
          <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#201f1e]">All Stores in Fleet ({stores.length})</h4>
          </div>

          <div className="space-y-2.5">
            {stores.map((s) => {
              const isSelected = activeStore?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveStore(s)}
                  className={`p-3.5 rounded-[4px] border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#eff6fc] border-[#0078d4] shadow-xs'
                      : 'bg-[#faf9f8] border-[#edebe9] hover:bg-white hover:border-[#d2d0ce]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#201f1e]">{s.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold border uppercase ${
                        s.hasBotToken
                          ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                          : 'bg-[#fde7e9] text-[#d13438] border-[#f9a8ad]'
                      }`}
                    >
                      {s.hasBotToken ? 'Connected' : 'No Token'}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#605e5c] mt-1 flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5 text-[#8a8886]" />
                    <span>{s.botUsername ? `@${s.botUsername}` : 'Pending configuration'}</span>
                  </p>

                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#edebe9] text-[10px] text-[#8a8886]">
                    <span>Currency: {s.currency}</span>
                    <span>•</span>
                    <span>Products: {s.counts?.products || 0}</span>
                    <span>•</span>
                    <span>Orders: {s.counts?.orders || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-[4px] shadow-fluentModal flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
            toast.type === 'error' ? 'bg-[#a4262c]' : 'bg-[#107c10]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
