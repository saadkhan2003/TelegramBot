'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiBase } from '../../lib/api';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import AboutStackAndScaleModal from '../../components/AboutStackAndScaleModal';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();

  // Navigation steps: 'email' | 'password' | 'forgot_email' | 'forgot_code' | 'forgot_success'
  const [step, setStep] = useState<'email' | 'password' | 'forgot_email' | 'forgot_code' | 'forgot_success'>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Password Recovery state
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);

  // Step 1: Email submit
  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter a valid email address or phone number.');
      return;
    }
    setError(null);
    setStep('password');
  };

  // Step 2: Password sign-in submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the password for your account.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Your account or password is incorrect. If you don\'t remember your password, reset it now.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - Step 1: Request OTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your staff or admin email address.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const base = getApiBase();
      const res = await fetch(`${base}/admin/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Unable to process password reset request.');
      }

      setRecoverySuccessMsg(data.message || 'A 6-digit recovery code was dispatched to your authorized Telegram account.');
      if (data.previewCode) {
        setRecoveryCode(data.previewCode);
      }
      setStep('forgot_code');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate password reset. Please contact system administrator.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - Step 2: Verify Code & Reset
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim() || recoveryCode.trim().length !== 6) {
      setError('Please enter the 6-digit code received on Telegram.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const base = getApiBase();
      const res = await fetch(`${base}/admin/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: recoveryCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setPassword(newPassword);
      setStep('forgot_success');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col justify-between items-center px-4 py-6 sm:justify-center sm:py-12 relative select-none font-sans"
      style={{
        backgroundColor: '#f2f4f8',
        backgroundImage: 'radial-gradient(#e1e6ed 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
      }}
    >
      {/* Microsoft Soft Ambient Blur Elements */}
      <div className="absolute top-1/6 left-1/4 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-[#0078d4]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/4 w-72 sm:w-[450px] h-72 sm:h-[450px] bg-[#00a4ef]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Spacer to push card vertically centered on mobile */}
      <div className="hidden sm:block flex-1 max-h-12" />

      {/* Main Centered Authentication Block */}
      <div className="w-full max-w-[440px] flex flex-col items-center z-10 my-auto sm:my-0">
        {/* Main Microsoft Auth Card */}
        <div className="w-full bg-white p-6 sm:p-11 shadow-[0_2px_6px_rgba(0,0,0,0.15)] sm:shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-[#edebe9] rounded-[4px] sm:rounded-[2px] text-[#1b1a19] transition-all">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-8 w-8 rounded-[7px] bg-[#051329] border border-[#0078d4]/40 overflow-hidden shadow-xs p-[1.5px] shrink-0">
              <img
                src="/icons/icon-192.png"
                alt="Store Admin"
               className="h-full w-full object-cover rounded-[5.5px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[18px] sm:text-[19px] tracking-tight text-[#1b1a19]">
                Store Admin
              </span>
            </div>
          </div>

          {/* Global Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-[2px] bg-[#fdf2f2] border-l-4 border-[#d13438] text-[#a4262c] text-xs flex items-start gap-2.5 animate-in fade-in duration-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#d13438]" />
              <div className="flex-1 font-normal leading-relaxed">{error}</div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: Enter Email / Account Identification             */}
          {/* ======================================================== */}
          {step === 'email' && (
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#1b1a19] mb-3 tracking-tight">
                Sign in
              </h1>

              <form onSubmit={handleEmailNext}>
                <div className="relative mt-2">
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email, phone, or Skype"
                    className="w-full border-b border-[#1b1a19] focus:border-b-2 focus:border-[#0067b8] focus:outline-none py-2 sm:py-1.5 text-base sm:text-sm text-[#1b1a19] placeholder-[#737373] transition bg-transparent"
                  />
                </div>

                <div className="mt-4 text-[13px] text-[#1b1a19] space-y-2.5">
                  <p>
                    No account?{' '}
                    <Link
                      href="/register"
                      className="text-[#0067b8] hover:underline cursor-pointer font-medium"
                    >
                      Create one!
                    </Link>
                  </p>
                  <p>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep('forgot_email');
                      }}
                      className="text-[#0067b8] hover:underline cursor-pointer text-left font-normal py-1"
                    >
                      Can’t access your account?
                    </button>
                  </p>
                </div>

                <div className="flex items-center justify-end pt-6 sm:pt-8">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#0067b8] hover:bg-[#005da6] active:bg-[#004e8c] text-white text-sm font-semibold px-9 py-2.5 sm:py-1.5 rounded-[2px] transition cursor-pointer shadow-2xs min-w-[108px] text-center"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: Enter Password                                   */}
          {/* ======================================================== */}
          {step === 'password' && (
            <div>
              {/* Account Pill with Back Arrow */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('email');
                }}
                className="flex items-center gap-2 text-xs text-[#1b1a19] hover:bg-[#f3f2f1] px-2 py-1.5 -ml-1 rounded-[2px] mb-3 transition group"
                title="Change account"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#1b1a19] group-hover:-translate-x-0.5 transition-transform" />
                <span className="truncate max-w-[260px] sm:max-w-[280px] font-normal">{email}</span>
              </button>

              <h1 className="text-xl sm:text-2xl font-semibold text-[#1b1a19] mb-3 tracking-tight">
                Enter password
              </h1>

              <form onSubmit={handleSignIn}>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full border-b border-[#1b1a19] focus:border-b-2 focus:border-[#0067b8] focus:outline-none py-2 sm:py-1.5 pr-10 text-base sm:text-sm text-[#1b1a19] placeholder-[#737373] transition bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1b1a19] p-2"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-4 text-[13px]">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep('forgot_email');
                    }}
                    className="text-[#0067b8] hover:underline cursor-pointer text-left font-normal py-1"
                  >
                    Forgot my password
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-6 sm:pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep('email');
                    }}
                    className="flex-1 sm:flex-initial bg-[#cccccc] hover:bg-[#b8b8b8] text-[#1b1a19] text-sm font-normal px-6 py-2.5 sm:py-1.5 rounded-[2px] transition cursor-pointer min-w-[85px] text-center"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-initial bg-[#0067b8] hover:bg-[#005da6] active:bg-[#004e8c] text-white text-sm font-semibold px-9 py-2.5 sm:py-1.5 rounded-[2px] transition cursor-pointer shadow-2xs min-w-[108px] flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign in</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* FORGOT PASSWORD - STEP 1: Enter User ID / Email          */}
          {/* ======================================================== */}
          {step === 'forgot_email' && (
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#1b1a19] mb-2 tracking-tight">
                Get back into your account
              </h1>
              <p className="text-xs text-[#605e5c] mb-5 leading-relaxed">
                Who are you? To recover your account, begin by entering your user ID and your authorized security channel.
              </p>

              <form onSubmit={handleRequestReset}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1b1a19] mb-1">
                      Staff / Admin Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@yourdomain.com"
                      className="w-full border-b border-[#1b1a19] focus:border-b-2 focus:border-[#0067b8] focus:outline-none py-2 sm:py-1.5 text-base sm:text-sm text-[#1b1a19] placeholder-[#737373] transition bg-transparent"
                    />
                  </div>

                  <div className="p-3 bg-[#eff6fc] border border-[#c7e0f4] rounded-[2px] text-xs text-[#004e8c] flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#0078d4]" />
                    <span className="leading-relaxed">
                      A 6-digit recovery code will be dispatched directly to your connected Telegram Security Bot channel.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-6 sm:pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep('email');
                    }}
                    className="flex-1 sm:flex-initial bg-[#cccccc] hover:bg-[#b8b8b8] text-[#1b1a19] text-sm font-normal px-6 py-2.5 sm:py-1.5 rounded-[2px] transition cursor-pointer min-w-[85px] text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-initial bg-[#0067b8] hover:bg-[#005da6] text-white text-sm font-semibold px-8 py-2.5 sm:py-1.5 rounded-[2px] transition cursor-pointer shadow-2xs min-w-[108px] flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Next</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* FORGOT PASSWORD - STEP 2: Verification Code & New Pwd    */}
          {/* ======================================================== */}
          {step === 'forgot_code' && (
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#1b1a19] mb-2 tracking-tight">
                Verification step
              </h1>
              <p className="text-xs text-[#605e5c] mb-4 leading-relaxed">
                We dispatched a 6-digit code to your authorized Telegram device for{' '}
                <span className="font-semibold text-[#1b1a19]">{email}</span>.
              </p>

              {recoverySuccessMsg && (
                <div className="mb-4 p-2.5 bg-[#dff6dd] border-l-4 border-[#107c10] text-[#107c10] text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{recoverySuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1b1a19] mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full border-b border-[#1b1a19] focus:border-b-2 focus:border-[#0067b8] focus:outline-none py-2 sm:py-1.5 text-lg sm:text-base tracking-widest font-mono text-[#1b1a19] placeholder-[#737373] transition bg-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b1a19] mb-1">
                    Enter New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full border-b border-[#1b1a19] focus:border-b-2 focus:border-[#0067b8] focus:outline-none py-2 sm:py-1.5 pr-10 text-base sm:text-sm text-[#1b1a19] placeholder-[#737373] transition bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#1b1a19] p-2"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b1a19] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full border-b border-[#1b1a19] focus:border-b-2 focus:border-[#0067b8] focus:outline-none py-2 sm:py-1.5 text-base sm:text-sm text-[#1b1a19] placeholder-[#737373] transition bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep('forgot_email');
                    }}
                    className="flex-1 sm:flex-initial bg-[#cccccc] hover:bg-[#b8b8b8] text-[#1b1a19] text-sm font-normal px-6 py-2.5 sm:py-1.5 rounded-[2px] transition cursor-pointer min-w-[85px] text-center"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-initial bg-[#0067b8] hover:bg-[#005da6] text-white text-sm font-semibold px-8 py-2.5 sm:py-1.5 rounded-[2px] transition cursor-pointer shadow-2xs min-w-[120px] flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Finish Reset</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* FORGOT PASSWORD - SUCCESS                                */}
          {/* ======================================================== */}
          {step === 'forgot_success' && (
            <div className="py-4 text-center space-y-4">
              <div className="h-14 w-14 mx-auto rounded-full bg-[#dff6dd] border border-[#a8e5a3] text-[#107c10] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h1 className="text-xl font-semibold text-[#1b1a19] tracking-tight">
                Password has been reset
              </h1>

              <p className="text-xs text-[#605e5c] leading-relaxed max-w-sm mx-auto">
                Your new password is now active and prior sessions have been revoked. You can proceed to sign in with your updated credentials.
              </p>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('password');
                  }}
                  className="w-full bg-[#0067b8] hover:bg-[#005da6] text-white text-sm font-semibold py-2.5 sm:py-2 rounded-[2px] transition cursor-pointer shadow-xs"
                >
                  Sign in with new password
                </button>
              </div>
            </div>
          )}

          {/* Stack & Scale Footer Inside Card */}
          <div className="pt-4 mt-6 border-t border-[#edebe9] flex items-center justify-between text-xs text-[#605e5c]">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="72" width="48" height="12" rx="3.5" fill="#1b1a19" fillOpacity="0.25" />
                <rect x="26" y="47" width="48" height="13" rx="3.5" fill="#1b1a19" fillOpacity="0.55" />
                <rect x="44" y="22" width="48" height="14" rx="3.5" fill="#1b1a19" />
              </svg>
              <span>Engineered by <strong className="font-semibold text-[#1b1a19]">Stack &amp; Scale</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="text-[#605e5c] hover:text-[#1b1a19] hover:underline cursor-pointer"
            >
              About software
            </button>
          </div>
        </div>

        {/* Microsoft Sign-In Options Pill (Below Card) */}
        {(step === 'email' || step === 'password') && (
          <div className="mt-4 sm:mt-5 w-full bg-white border border-[#edebe9] shadow-[0_2px_6px_rgba(0,0,0,0.1)] p-3 px-4 sm:px-5 flex items-center gap-3.5 cursor-pointer hover:bg-[#faf9f8] transition rounded-[4px] sm:rounded-[2px]">
            <KeyRound className="h-5 w-5 text-[#442726] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-normal text-[#1b1a19]">Sign-in options</p>
              <p className="text-[11px] text-[#737373] truncate">FIDO2 Key, Authenticator, Telegram OTP</p>
            </div>
          </div>
        )}
      </div>

      {/* Global Bottom Footer Matching Reference */}
      <footer className="w-full sm:fixed sm:bottom-0 sm:left-0 sm:right-0 py-3.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#605e5c] mt-6 sm:mt-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="72" width="48" height="12" rx="3.5" fill="#1b1a19" fillOpacity="0.25" />
              <rect x="26" y="47" width="48" height="13" rx="3.5" fill="#1b1a19" fillOpacity="0.55" />
              <rect x="44" y="22" width="48" height="14" rx="3.5" fill="#1b1a19" />
            </svg>
            <span>Made by <strong className="font-semibold text-[#1b1a19]">Stack &amp; Scale</strong></span>
          </div>
          <span>·</span>
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="hover:underline hover:text-[#1b1a19] cursor-pointer"
          >
            About Stack &amp; Scale
          </button>
        </div>

        <div className="flex items-center gap-5 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep('forgot_email');
            }}
            className="hover:underline hover:text-[#1b1a19] cursor-pointer"
          >
            Can’t access your account?
          </button>
          <span>© 2026 Store Admin Platform</span>
        </div>
      </footer>

      {/* About Stack & Scale Modal */}
      <AboutStackAndScaleModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </div>
  );
}
