'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { Reseller } from '@/types';
import {
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  Boxes,
  ShoppingBag,
  BarChart3,
  Store,
  ExternalLink,
  LogOut,
  AlertCircle
} from 'lucide-react';

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const resellerCode = (params.code as string)?.toLowerCase();
  const { user, role, reseller, token, logout, isLoading } = useAuth();
  const [resellerData, setResellerData] = useState<Reseller | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || role !== 'RESELLER')) {
      router.push('/login');
    }
  }, [isLoading, user, role, router]);

  useEffect(() => {
    if (token) {
      ApiClient.get<Reseller>('/reseller/profile', { token, params: { resellerCode } })
        .then(res => setResellerData(res))
        .catch(err => console.error(err));
    }
  }, [token, resellerCode]);

  const navLinks = [
    { href: `/reseller/${resellerCode}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/reseller/${resellerCode}/products`, label: 'Products & Approvals', icon: Package },
    { href: `/reseller/${resellerCode}/products/import`, label: 'Excel Product Importer', icon: FileSpreadsheet, highlight: true },
    { href: `/reseller/${resellerCode}/inventory`, label: 'Inventory & Stock', icon: Boxes },
    { href: `/reseller/${resellerCode}/orders`, label: 'Vendor Orders', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Reseller Left Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Vendor Brand */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {resellerData?.displayName || reseller?.displayName || 'ComNet Hardware Store'}
              </div>
              <div className="text-[10px] font-mono text-amber-400 truncate">
                {resellerCode}.store.com
              </div>
            </div>
          </div>

          {/* Subdomain Status Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Tenant Portal</span>
            <span className="font-mono font-bold text-emerald-400">ISOLATED ✓</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navLinks.map(({ href, label, icon: Icon, highlight }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : highlight
                      ? 'text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{label}</span>
                  {highlight && !isActive && (
                    <span className="ml-auto text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                      XLSX
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Storefront Link */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <span>Public Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-950/20 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Vendor</span>
          </button>
        </div>
      </aside>

      {/* Main Vendor Content Area */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
