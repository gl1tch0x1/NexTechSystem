'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/lib/currency-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Wallet, WalletTransaction } from '@/types';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  AlertCircle,
  X
} from 'lucide-react';

export default function CustomerWalletPage() {
  const { token, isAuthenticated } = useAuth();
  const { formatPrice, currentCurrency } = useCurrency();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState<number>(500);
  const [topupLoading, setTopupLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Secondary Security PIN Challenge state (Ported from Quickbook Two-Tier Control)
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  const fetchWallet = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await ApiClient.get<{ wallet: Wallet; transactions: WalletTransaction[] }>('/wallet', { token });
      setWallet(res.wallet);
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token]);

  const initiateTopup = (amount: number) => {
    if (amount > 2500) {
      setPendingAmount(amount);
      setAdminPin('');
      setPinError('');
      setPinModalOpen(true);
    } else {
      executeTopup(amount);
    }
  };

  const executeTopup = async (amount: number, pin?: string) => {
    if (!token) return;
    setTopupLoading(true);
    setSuccessMessage('');
    setPinError('');
    try {
      await ApiClient.post('/wallet/add-funds', { amount, adminPin: pin }, { token });
      await fetchWallet();
      setPinModalOpen(false);
      setSuccessMessage(`Successfully credited ${formatPrice(amount)} to your wallet ledger!`);
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('PIN')) {
        setPinError(err.message);
      } else {
        setPinError('Transaction rejected by security gateway.');
      }
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-200 dark:border-tech-slate">
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
          <Link href="/account" className="hover:text-tech-blue">Account</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-bold">Wallet Ledger</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Customer Wallet & Immutable Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Instant checkout credits, refunds, and promotional balance management.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Balance Card & Sandbox Top-up */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-tech-dark via-slate-900 to-tech-slate border border-slate-700 text-white space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <WalletIcon className="w-40 h-40 text-tech-cyan" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-tech-cyan tracking-wider">
                NexTech Verified Wallet
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Available Balance</div>
              <div className="text-4xl font-black tracking-tight text-white mt-1">
                {formatPrice(wallet?.balance || 0)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">100% redeemable across all hardware orders</div>
            </div>

            <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>LEDGER # {wallet?.id}</span>
              <span>AED CURRENCY</span>
            </div>
          </div>

          {/* Sandbox Top-up Buttons */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-tech-cyan" />
              Instant Sandbox Top-Up
            </h3>

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(500)}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-tech-blue hover:text-white text-slate-300 text-xs font-bold transition-colors"
              >
                +AED 500
              </button>
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(1000)}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-tech-blue hover:text-white text-slate-300 text-xs font-bold transition-colors"
              >
                +AED 1,000
              </button>
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(2500)}
                className="py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-tech-blue hover:text-white text-slate-300 text-xs font-bold transition-colors"
              >
                +AED 2,500
              </button>
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(5000)}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-700/50 hover:border-cyan-400 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                title="High-Value Authorization (Requires Admin PIN)"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>+AED 5,000</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Immutable Transaction Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-white pb-3 border-b border-slate-800">
              Immutable Transaction Ledger
            </h3>

            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tx.type === 'CREDIT' || tx.type === 'REFUND'
                            ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                            : 'bg-red-950/50 text-red-300 border border-red-800/50'
                        }`}
                      >
                        {tx.type === 'CREDIT' || tx.type === 'REFUND' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-white">{tx.reason}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(tx.createdAt)} • Ref: {tx.referenceId || tx.id.slice(0, 10)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-black font-mono text-sm ${
                          tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {tx.type === 'CREDIT' || tx.type === 'REFUND' ? '+' : '-'}
                        {formatPrice(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Balance: {formatPrice(tx.balanceAfter)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                No ledger transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Security PIN Authorization Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setPinModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Secondary Security PIN</h3>
                <p className="text-xs text-slate-400">Two-Tier Administrative Financial Authorization</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Operation</span>
                <span className="font-bold text-white">High-Value Wallet Injection</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Credit Amount</span>
                <span className="font-bold text-cyan-400 font-mono text-sm">{formatPrice(pendingAmount)}</span>
              </div>
            </div>

            {pinError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                executeTopup(pendingAmount, adminPin);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Enter 6-Digit Admin PIN
                </label>
                <input
                  type="password"
                  maxLength={12}
                  autoFocus
                  placeholder="••••••"
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
                <div className="text-[11px] text-slate-500 mt-1 text-center">
                  Protected with PBKDF2 120,000 iterations & timingSafeEqual
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={topupLoading || !adminPin}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20"
                >
                  {topupLoading ? 'Verifying PIN...' : 'Authorize Credit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
