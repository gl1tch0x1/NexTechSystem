'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate, formatPrice } from '@/lib/utils';
import { User } from '@/types';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  CreditCard,
  Plus,
  Minus,
  Sparkles,
  X,
  ShoppingBag,
  MapPin,
  Eye,
  ShieldCheck
} from 'lucide-react';

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Wallet adjustment modal state
  const [walletModalCustomer, setWalletModalCustomer] = useState<any | null>(null);
  const [walletAmount, setWalletAmount] = useState<number>(500);
  const [walletType, setWalletType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [walletReason, setWalletReason] = useState<string>('Administrative Promotional Credit');
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
  const [walletError, setWalletError] = useState('');

  // Customer detail modal
  const [detailCustomer, setDetailCustomer] = useState<any | null>(null);

  const fetchCustomers = () => {
    if (token) {
      ApiClient.get<any[]>('/admin/customers', { token })
        .then(res => setCustomers(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleToggleStatus = async (customer: User) => {
    if (!token) return;
    try {
      await ApiClient.put(`/admin/customers/${customer.id}/toggle-status`, {}, { token });
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !walletModalCustomer) return;
    setIsSubmittingWallet(true);
    setWalletError('');

    try {
      await ApiClient.post(
        `/admin/customers/${walletModalCustomer.id}/wallet-adjust`,
        {
          amount: Number(walletAmount),
          type: walletType,
          reason: walletReason,
        },
        { token }
      );
      setWalletModalCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      setWalletError(err.message || 'Failed to adjust wallet balance.');
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Enterprise Client Registry & Accounts
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Directory & Wallet Balances
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Inspect verified customer accounts, monitor total spend, and execute direct hardware wallet balance adjustments.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search customers by name, email, or username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold">
          {customers.length} Registered Customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[850px] text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[220px]">Customer Profile</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Contact Details</th>
                <th className="py-3.5 px-4 font-bold min-w-[130px] whitespace-nowrap">Wallet Balance</th>
                <th className="py-3.5 px-4 font-bold min-w-[100px] whitespace-nowrap">Orders Placed</th>
                <th className="py-3.5 px-4 font-bold min-w-[90px] whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 font-bold text-right min-w-[130px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{cust.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{cust.email}</div>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">@{cust.username || 'user'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 dark:text-slate-300">{cust.phone || 'No phone'}</div>
                      <div className="text-[10px] text-slate-500">Joined {formatDate(cust.createdAt)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                          {formatPrice(cust.walletBalance || 0)}
                        </span>
                        <button
                          onClick={() => {
                            setWalletModalCustomer(cust);
                            setWalletAmount(500);
                            setWalletType('CREDIT');
                            setWalletError('');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-tech-blue/10 hover:bg-tech-blue text-tech-blue hover:text-white text-[10px] font-bold border border-tech-blue/30 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Adjust</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{cust.orderCount || 0} Orders</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{formatPrice(cust.totalSpent || 0)} spent</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          cust.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {cust.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailCustomer(cust)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(cust)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            cust.isActive
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                              : 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {cust.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No customer accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WALLET ADJUSTMENT MODAL */}
      {walletModalCustomer && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-tech-blue" />
                Adjust Customer Wallet
              </h2>
              <button onClick={() => setWalletModalCustomer(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-xs font-bold text-slate-900 dark:text-white">{walletModalCustomer.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{walletModalCustomer.email}</div>
              <div className="text-xs font-bold text-tech-blue pt-1">
                Current Balance: {formatPrice(walletModalCustomer.walletBalance || 0)}
              </div>
            </div>

            {walletError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-900/50">
                {walletError}
              </div>
            )}

            <form onSubmit={handleAdjustWallet} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWalletType('CREDIT')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    walletType === 'CREDIT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Credit (Top Up)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWalletType('DEBIT')}
                  className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    walletType === 'DEBIT'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Debit (Deduct)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Adjustment Amount (د.إ) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={1}
                  value={walletAmount}
                  onChange={e => setWalletAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Reason / Note for Ledger *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Promotional Bonus, Hardware Refund..."
                  value={walletReason}
                  onChange={e => setWalletReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setWalletModalCustomer(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWallet}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-purple-600/20 transition-all"
                >
                  {isSubmittingWallet ? 'Processing...' : 'Apply Wallet Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS MODAL */}
      {detailCustomer && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Customer Account Profile
              </h2>
              <button onClick={() => setDetailCustomer(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Full Name:</span>
                <div className="font-bold text-slate-900 dark:text-white">{detailCustomer.name}</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Email Address:</span>
                <div className="font-mono text-purple-600 dark:text-purple-300">{detailCustomer.email}</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                <div className="text-slate-700 dark:text-slate-200">{detailCustomer.phone || 'Not provided'}</div>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Addresses ({detailCustomer.addresses?.length || 0}):</span>
                {detailCustomer.addresses && detailCustomer.addresses.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {detailCustomer.addresses.map((a: any, i: number) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        <div>{a.addressLine1}</div>
                        <div>{a.city}, {a.country} ({a.postalCode})</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic mt-0.5">No registered addresses</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDetailCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

