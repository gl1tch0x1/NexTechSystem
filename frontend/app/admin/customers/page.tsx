'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate, formatPrice } from '@/lib/utils';
import { User } from '@/types';
import {
  Users,
  Search,
  ShoppingBag,
  TrendingUp,
  X,
  Eye,
} from 'lucide-react';

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Customer detail modal
  const [detailCustomer, setDetailCustomer] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchCustomers = () => {
    if (token) {
      setIsLoading(true);
      ApiClient.get<any[]>('/admin/customers', { token })
        .then(res => setCustomers(res || []))
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleToggleStatus = async (customer: User) => {
    if (!token) return;
    try {
      await ApiClient.put(`/admin/customers/${customer.id}/toggle-status`, {}, { token });
      showToast('success', `Customer account ${customer.isActive ? 'deactivated' : 'activated'} successfully.`);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to toggle account status.');
    }
  };

  const filtered = useMemo(() => {
    return customers.filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  // Aggregate metrics
  const totalPurchasedAllTime = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);
  }, [customers]);

  const totalOrdersAllTime = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.orderCount) || 0), 0);
  }, [customers]);

  const avgLifetimeSpend = useMemo(() => {
    if (customers.length === 0) return 0;
    return totalPurchasedAllTime / customers.length;
  }, [customers, totalPurchasedAllTime]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Enterprise Client Registry & Accounts
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Directory & Lifetime Purchasing
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Inspect verified customer accounts, monitor all-time total purchase volumes, and analyze individual client spending history.
          </p>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Registered Clients</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {customers.filter(c => c.isActive).length} active customer profiles
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">All-Time Cumulative Purchases</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {formatPrice(totalPurchasedAllTime)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {totalOrdersAllTime} fulfilled orders
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Average Lifetime Spend (LTV)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {formatPrice(avgLifetimeSpend)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Per registered customer account
          </div>
        </div>
      </div>

      {/* Search Bar */}
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
          Showing {filtered.length} of {customers.length} Accounts
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[850px] text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[220px]">Customer Profile</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Contact & Registration</th>
                <th className="py-3.5 px-4 font-bold min-w-[160px] whitespace-nowrap">All-Time Total Purchased</th>
                <th className="py-3.5 px-4 font-bold min-w-[140px] whitespace-nowrap">Orders History</th>
                <th className="py-3.5 px-4 font-bold min-w-[90px] whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 font-bold text-right min-w-[110px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length > 0 ? (
                filtered.map(cust => {
                  const spent = Number(cust.totalSpent) || 0;
                  const orders = Number(cust.orderCount) || 0;
                  const avgOrderValue = orders > 0 ? spent / orders : 0;

                  return (
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
                        <div>
                          <div className="font-black text-slate-900 dark:text-white font-mono text-sm text-emerald-600 dark:text-emerald-400">
                            {formatPrice(spent)}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            {spent >= 10000 ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                Tier 1 Client
                              </span>
                            ) : spent > 0 ? (
                              <span className="text-slate-500">Active Purchaser</span>
                            ) : (
                              <span className="text-slate-400">No purchases yet</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{orders} Orders Placed</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {orders > 0 ? `Avg: ${formatPrice(avgOrderValue)} / order` : 'Zero order volume'}
                        </div>
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
                            title="View Spending Profile"
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {isLoading ? 'Loading customer accounts...' : 'No customer accounts found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER DETAILS MODAL */}
      {detailCustomer && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Customer Account & Spend Profile
              </h2>
              <button
                onClick={() => setDetailCustomer(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lifetime Purchasing Highlights */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">All-Time Purchased</div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {formatPrice(detailCustomer.totalSpent || 0)}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Orders</div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {detailCustomer.orderCount || 0} Orders
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
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
                  <span className="text-slate-500 dark:text-slate-400">Account Created:</span>
                  <div className="text-slate-700 dark:text-slate-200">{formatDate(detailCustomer.createdAt)}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Registered Delivery Addresses ({detailCustomer.addresses?.length || 0}):</span>
                {detailCustomer.addresses && detailCustomer.addresses.length > 0 ? (
                  <div className="mt-1.5 space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                    {detailCustomer.addresses.map((a: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{a.addressLine1}</div>
                        <div className="text-slate-500">{a.city}, {a.country} ({a.postalCode})</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic mt-1 text-xs">No registered addresses found.</div>
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
