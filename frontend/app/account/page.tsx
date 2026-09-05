'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, Wallet } from '@/types';
import {
  User,
  ShoppingBag,
  Wallet as WalletIcon,
  Heart,
  FileText,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function CustomerAccountDashboard() {
  const { user, token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      Promise.all([
        ApiClient.get<Order[]>('/orders/my', { token }),
        ApiClient.get<{ wallet: Wallet }>('/wallet', { token }),
      ])
        .then(([ordRes, walRes]) => {
          setOrders(ordRes || []);
          setWallet(walRes?.wallet || null);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-tech-slate flex items-center justify-center text-slate-400 mx-auto">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer Account Access</h2>
          <p className="text-xs text-slate-500 mt-1">Please sign in to view your orders, wallet balance, and digital e-bills.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-tech"
          >
            Sign In to Account
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Create an Account
          </Link>
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-tech-dark via-slate-900 to-tech-slate border border-slate-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-tech">
        <div className="space-y-1">
          <div className="text-xs font-mono text-tech-cyan">ACCOUNT # {user?.id}</div>
          <h1 className="text-2xl sm:text-3xl font-black">Welcome back, {user?.name}!</h1>
          <p className="text-xs text-slate-400">{user?.email} • Verified Customer Account</p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/account/wallet"
            className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-right min-w-[140px]"
          >
            <div className="text-[10px] uppercase font-bold text-tech-cyan tracking-wider">Wallet Balance</div>
            <div className="text-xl font-black">{formatPrice(wallet?.balance || 0)}</div>
          </Link>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/account/orders"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-tech-blue transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-tech-cyan" />
          </div>
          <div className="text-2xl font-black text-white">{orders.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Lifetime completed purchases</div>
        </Link>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase">Total Spend</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(totalSpent)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Includes UAE VAT & deliveries</div>
        </div>

        <Link
          href="/account/wallet"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-tech-cyan transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase">Wallet Credits</span>
            <WalletIcon className="w-5 h-5 text-tech-cyan" />
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(wallet?.balance || 0)}</div>
          <div className="text-[11px] text-tech-cyan mt-1">Available for immediate checkout</div>
        </Link>

        <Link
          href="/account/wishlist"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase">Saved Wishlist</span>
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-white">View Saved</div>
          <div className="text-[11px] text-slate-400 mt-1">High-performance components</div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-tech-cyan" />
            Recent Orders & E-Bills
          </h3>
          <Link href="/account/orders" className="text-xs font-bold text-tech-cyan hover:underline">
            View All Orders →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] bg-blue-950/50 text-blue-300 border border-blue-800/50 font-bold px-2 py-0.5 rounded">
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Placed on {formatDate(order.createdAt)} • {order.items.length} items
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <div className="text-sm font-extrabold text-white">
                    {formatPrice(order.total)}
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="px-4 py-2 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-1 shadow-tech"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Invoice</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-400">
            No previous orders found in account history.
          </div>
        )}
      </div>
    </div>
  );
}
