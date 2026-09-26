'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('msaad.official6@gmail.com');
  const [password, setPassword] = useState('Saad_@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#051329] via-[#091b36] to-[#040d1a] relative overflow-hidden select-none">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#0078d4]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#00b4d8]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Luxury Brand Card */}
        <div className="bg-[#0b1e38]/80 backdrop-blur-xl border border-[#0078d4]/30 rounded-[12px] p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex relative mb-4">
              <div className="h-16 w-16 rounded-[14px] bg-[#051329] border border-[#0078d4]/50 shadow-[0_0_25px_rgba(0,120,212,0.4)] p-[2px] overflow-hidden mx-auto">
                <img
                  src="/icons/icon-192.png"
                  alt="Delux Store"
                  className="h-full w-full object-cover rounded-[12px]"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-[#0078d4] text-white rounded-full shadow-md">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight">Delux Store Admin</h1>
            <p className="text-xs text-[#a19f9d] mt-1">
              Enterprise Telegram Bot, Multi-Tenant Store & Ledger Control
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-[6px] bg-[#d13438]/15 border border-[#d13438]/40 text-[#ff8b8f] text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#ff8b8f]" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#e1dfdd] mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@deluxstore.com"
                  className="w-full bg-[#051329]/90 border border-[#0078d4]/30 rounded-[6px] pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#8a8886] focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#e1dfdd]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#051329]/90 border border-[#0078d4]/30 rounded-[6px] pl-9 pr-10 py-2.5 text-xs text-white placeholder-[#8a8886] focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8886] hover:text-white transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0078d4] to-[#0098f4] hover:from-[#106ebe] hover:to-[#0078d4] disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-[6px] shadow-[0_4px_15px_rgba(0,120,212,0.35)] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Sign In to Console</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Notice */}
          <div className="mt-6 pt-5 border-t border-[#0078d4]/20 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8a8886]">
              <Sparkles className="h-3 w-3 text-[#00b4d8]" />
              <span>Multi-Tenant & Staff Access Enabled</span>
            </div>
            <p className="text-[10px] text-[#605e5c] mt-1">
              Encrypted end-to-end sessions protected by JWT and Argon2/Bcrypt hash verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
