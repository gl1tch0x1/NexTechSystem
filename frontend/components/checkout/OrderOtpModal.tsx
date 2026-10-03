'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  KeyRound
} from 'lucide-react';

interface OrderOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (otpCode: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  maskedEmail: string;
  orderTotalFormatted: string;
  itemsCount: number;
  initialCooldownSeconds?: number;
  devCode?: string;
  isSubmitting: boolean;
  errorMessage?: string;
}

export default function OrderOtpModal({
  isOpen,
  onClose,
  onConfirm,
  onResendOtp,
  maskedEmail,
  orderTotalFormatted,
  itemsCount,
  initialCooldownSeconds = 60,
  devCode,
  isSubmitting,
  errorMessage: externalError,
}: OrderOtpModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState<number>(initialCooldownSeconds);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendSuccessNotice, setResendSuccessNotice] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset digits when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setLocalError('');
      setResendSuccessNotice('');
      setCooldown(initialCooldownSeconds);
      // Auto-focus first digit input after modal animation
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialCooldownSeconds]);

  // Cooldown countdown timer
  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, cooldown]);

  if (!isOpen) return null;

  const currentCode = digits.join('');

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const numericChar = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = numericChar;
    setDigits(newDigits);
    setLocalError('');

    if (numericChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);
    setLocalError('');

    const targetFocus = Math.min(pastedData.length, 5);
    inputRefs.current[targetFocus]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCode.length !== 6) {
      setLocalError('Please enter all 6 digits of the verification code.');
      return;
    }
    setLocalError('');
    try {
      await onConfirm(currentCode);
    } catch (err: any) {
      // The parent handles error display
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendSuccessNotice('');
    setLocalError('');
    try {
      await onResendOtp();
      setCooldown(60);
      setResendSuccessNotice('A fresh verification code was sent to your email.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleAutoFillDev = () => {
    if (!devCode || devCode.length !== 6) return;
    const split = devCode.split('');
    setDigits(split);
    setLocalError('');
    inputRefs.current[5]?.focus();
  };

  const activeError = localError || externalError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-modal-title"
      >
        {/* Top Header Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-tech-blue via-emerald-500 to-tech-cyan" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Badges */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-tech-blue dark:text-tech-cyan shadow-xs mb-1">
              <KeyRound className="w-6 h-6 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Two-Factor Order Verification</span>
            </div>

            <h2 id="otp-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Authorize Hardware Order
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              To safeguard your technology allocation, we dispatched a 6-digit confirmation code to:
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              <Mail className="w-3.5 h-3.5 text-tech-blue" />
              <span>{maskedEmail || 'registered-email@company.ae'}</span>
            </div>
          </div>

          {/* Order Summary Snapshot */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Allocation: </span>
              <strong className="text-slate-900 dark:text-white">{itemsCount} Item{itemsCount > 1 ? 's' : ''}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400">Total Payable: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{orderTotalFormatted}</strong>
            </div>
          </div>

          {/* OTP Code Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Segmented 6-digit inputs */}
            <div className="space-y-2">
              <label className="block text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enter 6-Digit One-Time Password
              </label>

              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    disabled={isSubmitting}
                    className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black font-mono rounded-2xl border transition-all duration-200 outline-hidden ${
                      digit
                        ? 'border-tech-blue dark:border-tech-cyan bg-blue-50/50 dark:bg-blue-950/40 text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-white'
                    } focus:border-tech-blue dark:focus:border-tech-cyan focus:ring-4 focus:ring-tech-blue/20 dark:focus:ring-tech-cyan/20`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {/* Error Message Alert */}
            {activeError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{activeError}</span>
              </div>
            )}

            {/* Resend Success Notice */}
            {resendSuccessNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resendSuccessNotice}</span>
              </div>
            )}

            {/* Development Mode Tip */}
            {devCode && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dev Preview OTP: <strong>{devCode}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillDev}
                  className="px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 font-bold text-[10px] hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Resend Action & Expiry Indicator */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Valid for 10 minutes</span>
              </div>

              <div>
                {cooldown > 0 ? (
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">
                    Resend code in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || isSubmitting}
                    className="inline-flex items-center gap-1 text-tech-blue dark:text-tech-cyan hover:underline font-bold transition-colors disabled:opacity-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend Code</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="submit"
                disabled={currentCode.length !== 6 || isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-tech-blue hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-tech-blue/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code &amp; Allocating Stock...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Confirm Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel &amp; Modify Checkout Details
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Trust Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span>Protected by NexTech End-to-End Enterprise Cryptographic Security</span>
        </div>
      </div>
    </div>
  );
}
