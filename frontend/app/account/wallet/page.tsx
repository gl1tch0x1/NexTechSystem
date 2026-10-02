'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/lib/currency-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Wallet, WalletTransaction } from '@/types';
import { DirhamSymbol, DirhamBadge } from '@/components/ui/DirhamSymbol';
import { CustomerPortalHeader } from '@/components/account/CustomerPortalHeader';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  X,
  History,
  Search,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

function CustomerWalletContent() {
  const { token } = useAuth();
  const { formatPrice } = useCurrency();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [topupLoading, setTopupLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Secondary Security PIN Challenge state
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Ledger Filter & Search
  const [txFilter, setTxFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'REFUND'>('ALL');
  const [txSearch, setTxSearch] = useState('');

  const fetchWallet = async () => {
    if (!token) return;
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
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('PIN')) {
        setPinError(err.message);
      } else {
        setPinError('Transaction rejected by security gateway. Please verify credentials.');
      }
    } finally {
      setTopupLoading(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (txFilter !== 'ALL' && tx.type !== txFilter) {
        return false;
      }
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const matchesRef = tx.referenceId?.toLowerCase().includes(q) || tx.id?.toLowerCase().includes(q);
        const matchesDesc = tx.reason?.toLowerCase().includes(q);
        if (!matchesRef && !matchesDesc) return false;
      }
      return true;
    });
  }, [transactions, txFilter, txSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Customer Portal Navigation Shell */}
      <CustomerPortalHeader walletBalance={wallet?.balance} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Digital Wallet & Immutable Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Instant 1-click checkout credits, automated refund settlements, and Central Bank of UAE compliant AED ledger
          </p>
        </div>

        <button
          onClick={fetchWallet}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Titanium Wallet Card & Top-Up */}
        <div className="lg:col-span-5 space-y-6">
          {/* Executive Digital Wallet Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white space-y-6 shadow-2xl relative overflow-hidden border border-slate-700/80">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <WalletIcon className="w-48 h-48 text-tech-cyan" />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <DirhamBadge size={42} variant="glass" weight="bold" />
                <div>
                  <span className="text-xs font-mono uppercase font-bold text-tech-cyan tracking-wider block">
                    NexTech Titanium Ledger
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Central Bank of UAE (U+20C3)</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </div>
            </div>

            <div className="relative z-10">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Available Wallet Balance
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-2 flex items-baseline gap-2">
                <span>{formatPrice(wallet?.balance || 0)}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-tech-cyan" />
                <span>100% redeemable across all GPUs, servers, and custom PC builds</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono relative z-10">
              <span className="truncate max-w-[180px]">LEDGER: {wallet?.id || 'NXT-WLT-001'}</span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <DirhamSymbol size={13} weight="bold" />
                <span>AED CURRENCY</span>
              </span>
            </div>
          </div>

          {/* Instant Sandbox Top-Up Presets */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Plus className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
                <span>Instant Wallet Top-Up</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Fast Checkout Credits</span>
            </div>

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(500)}
                className="py-3 px-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-tech-blue dark:hover:border-tech-blue hover:bg-blue-50/50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>+</span>
                <DirhamSymbol size={13} weight="bold" className="text-tech-blue dark:text-tech-cyan" />
                <span>500</span>
              </button>
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(1000)}
                className="py-3 px-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-tech-blue dark:hover:border-tech-blue hover:bg-blue-50/50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>+</span>
                <DirhamSymbol size={13} weight="bold" className="text-tech-blue dark:text-tech-cyan" />
                <span>1,000</span>
              </button>
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(2500)}
                className="py-3 px-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-tech-blue dark:hover:border-tech-blue hover:bg-blue-50/50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>+</span>
                <DirhamSymbol size={13} weight="bold" className="text-tech-blue dark:text-tech-cyan" />
                <span>2,500</span>
              </button>
              <button
                disabled={topupLoading}
                onClick={() => initiateTopup(5000)}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-blue-600/10 to-cyan-600/10 hover:from-blue-600/20 hover:to-cyan-600/20 border border-blue-500/30 text-tech-blue dark:text-tech-cyan text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                title="High-Value Authorization (Admin PIN Required)"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>+AED 5,000</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Amounts above AED 2,500 require secondary PIN authorization for security.
            </p>
          </div>
        </div>

        {/* Right Column: Immutable Transaction Ledger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
                  <span>Immutable Audit Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cryptographically verified debit, credit, and refund records
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['ALL', 'CREDIT', 'DEBIT', 'REFUND'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      txFilter === f
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input for Transactions */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                placeholder="Search ledger by transaction reference or description..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue"
              />
              {txSearch && (
                <button
                  onClick={() => setTxSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Transactions List */}
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map(tx => {
                  const isCredit = tx.type === 'CREDIT' || tx.type === 'REFUND';
                  return (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.reason || `${tx.type} Transaction`}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                            <span>{formatDate(tx.createdAt)}</span>
                            <span>•</span>
                            <span className="truncate">{tx.referenceId || tx.id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm font-black font-mono ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatPrice(tx.amount)}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {tx.type}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <History className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {txSearch || txFilter !== 'ALL' ? 'No Matching Ledger Records' : 'No Wallet Activity Yet'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {txSearch || txFilter !== 'ALL'
                    ? 'Try clearing your filter or searching for another reference.'
                    : 'Funds credited or redeemed on hardware orders will be recorded here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security PIN Authorization Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-slate-800 text-tech-blue dark:text-tech-cyan shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  High-Value Security Authorization
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transactions exceeding AED 2,500 require executive security verification.
                </p>
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
                {pinError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Enter Authorization Security PIN:
              </label>
              <input
                type="password"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                placeholder="Enter PIN (e.g. 7890 or admin PIN)"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={topupLoading}
                onClick={() => setPinModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={topupLoading || !adminPin.trim()}
                onClick={() => executeTopup(pendingAmount, adminPin)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-tech-blue hover:bg-blue-600 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {topupLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize {formatPrice(pendingAmount)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerWalletPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading Wallet...</div>}>
      <CustomerWalletContent />
    </Suspense>
  );
}
