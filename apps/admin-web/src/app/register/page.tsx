'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Store,
  User,
  Mail,
  Lock,
  ChevronRight,
  Bot,
  Sparkles,
} from 'lucide-react';

type Step = 'account' | 'store' | 'done';

export default function RegisterPage() {
  const { register } = useAuth();

  const [step, setStep] = useState<Step>('account');

  // Account fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Store fields
  const [storeName, setStoreName] = useState('');
  const [currency, setCurrency] = useState('USD');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength
  const getStrength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = getStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#d13438', '#f7630c', '#0078d4', '#107c10'][strength];

  const handleAccountNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setStoreName(`${name.trim()}'s Store`);
    setStep('store');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, storeName: storeName.trim() || undefined, currency });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#f3f2f1]"
      style={{ fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif' }}
    >
      <div className="w-full max-w-[440px] px-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0078d4] mb-4 shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1b1a19]">Create your account</h1>
          <p className="text-sm text-[#605e5c] mt-1">
            Set up your Telegram store in under a minute.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {(['account', 'store'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-[#0078d4] text-white'
                      : i < ['account', 'store'].indexOf(step)
                      ? 'bg-[#107c10] text-white'
                      : 'bg-[#edebe9] text-[#8a8886]'
                  }`}
                >
                  {i < ['account', 'store'].indexOf(step) ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? 'text-[#0078d4]' : 'text-[#8a8886]'}`}>
                  {s === 'account' ? 'Account' : 'Your Store'}
                </span>
              </div>
              {i < 1 && <div className="flex-1 h-px bg-[#edebe9]" />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-[#edebe9] rounded-lg shadow-sm overflow-hidden">
          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 px-5 py-3 bg-[#fdf6f6] border-b border-[#f4c8c8] text-[#a4262c] text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Account */}
          {step === 'account' && (
            <form onSubmit={handleAccountNext} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1b1a19] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Full Name
                  </span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmed Hassan"
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-2 text-sm text-[#1b1a19] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1a19] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email address
                  </span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-2 text-sm text-[#1b1a19] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1a19] mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Password
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-2 pr-9 text-sm text-[#1b1a19] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a8886] hover:text-[#1b1a19] transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="h-1 flex-1 rounded-full transition-all"
                          style={{ backgroundColor: n <= strength ? strengthColor : '#edebe9' }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1a19] mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-2 text-sm text-[#1b1a19] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-[#a4262c] mt-1">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] active:bg-[#005a9e] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer mt-2"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 2: Store setup */}
          {step === 'store' && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-[#0078d4]" />
                <p className="text-xs text-[#605e5c]">
                  We'll create your first store automatically. You can change it any time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1a19] mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Ahmed's Digital Store"
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-2 text-sm text-[#1b1a19] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
                />
                <p className="text-[10px] text-[#8a8886] mt-1">Leave blank to use the default name.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1a19] mb-1.5">Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-2 text-sm text-[#1b1a19] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition"
                >
                  <option value="USD">USD ($) — US Dollar</option>
                  <option value="PKR">PKR (Rs) — Pakistani Rupee</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                  <option value="AED">AED (د.إ) — UAE Dirham</option>
                  <option value="SAR">SAR (﷼) — Saudi Riyal</option>
                </select>
              </div>

              <div className="bg-[#eff6fc] border border-[#c7e0f4] rounded-[4px] p-3 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[#0078d4] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#004578]">
                  <p className="font-semibold mb-0.5">You can connect your Telegram Bot later</p>
                  <p className="text-[#004578]/80">Head to <strong>Settings → Bot Token</strong> after signup to connect your @BotFather token.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setError(null); setStep('account'); }}
                  className="flex-1 py-2.5 rounded-[4px] border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#605e5c] font-medium text-sm transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-2.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] active:bg-[#005a9e] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sign in link */}
        <p className="text-center text-xs text-[#605e5c] mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0078d4] hover:underline font-semibold">
            Sign in
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#a19f9d] mt-6">
          By creating an account, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
