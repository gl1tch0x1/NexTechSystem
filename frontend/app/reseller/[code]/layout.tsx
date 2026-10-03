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
  Store,
  ExternalLink,
  LogOut,
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  CreditCard,
  Settings,
  FileQuestion,
  Plus,
  CheckCircle2
} from 'lucide-react';

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const resellerCode = (params.code as string)?.toLowerCase();
  const { user, role, reseller, token, logout, isLoading } = useAuth();
  const [resellerData, setResellerData] = useState<Reseller | null>(null);

  useEffect(() => {
    // Permit authorized RESELLER accounts as well as master ADMINs inspecting the portal
    if (!isLoading && (!user || (role !== 'RESELLER' && role !== 'ADMIN'))) {
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

  const navSections = [
    {
      title: 'Catalog & Inventory',
      items: [
        { href: `/reseller/${resellerCode}/dashboard`, label: 'Command Center', icon: LayoutDashboard },
        { href: `/reseller/${resellerCode}/products`, label: 'Hardware SKUs & Approvals', icon: Package },
        { href: `/reseller/${resellerCode}/products/import`, label: 'Excel Bulk Ingestion', icon: FileSpreadsheet, badge: 'XLSX' },
        { href: `/reseller/${resellerCode}/inventory`, label: 'Warehousing & Stock', icon: Boxes },
      ]
    },
    {
      title: 'Commercial & Sales',
      items: [
        { href: `/reseller/${resellerCode}/orders`, label: 'Vendor Orders', icon: ShoppingBag },
        { href: `/reseller/${resellerCode}/quotes`, label: 'B2B Corporate Quotes', icon: FileQuestion, badge: 'RFQ' },
        { href: `/reseller/${resellerCode}/analytics`, label: 'Performance Analytics', icon: BarChart3 },
        { href: `/reseller/${resellerCode}/payouts`, label: 'Settlements & Payouts', icon: CreditCard },
      ]
    },
    {
      title: 'Account & Operations',
      items: [
        { href: `/reseller/${resellerCode}/settings`, label: 'Vendor Store & Compliance', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Reseller Left Sidebar - Crisp Enterprise Light Theme */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Admin Impersonation Banner */}
          {role === 'ADMIN' && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Admin Inspection Mode</span>
              </div>
              <p className="text-[11px] text-amber-700 mb-2 leading-relaxed">
                Viewing vendor portal telemetry with master administrator privileges.
              </p>
              <Link
                href="/admin/resellers"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-700 hover:underline"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Master Admin</span>
              </Link>
            </div>
          )}

          {/* Vendor Brand Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-slate-200/90 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate">
                {resellerData?.displayName || reseller?.displayName || 'ComNet Hardware Store'}
              </div>
              <div className="text-[10px] font-mono font-semibold text-amber-700 truncate flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{resellerCode}.store.com</span>
              </div>
            </div>
          </div>

          {/* Subdomain Status Pill */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-semibold">Tenant Protocol</span>
            <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>ISOLATED ✓</span>
            </span>
          </div>

          {/* Quick SKU Creation CTA Button */}
          <Link
            href={`/reseller/${resellerCode}/products?action=new`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product SKU</span>
          </Link>

          {/* Navigation Sections */}
          <nav className="space-y-5">
            {navSections.map(section => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  {section.title}
                </div>
                {section.items.map(({ href, label, icon: Icon, badge }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="truncate">{label}</span>
                      {badge && (
                        <span className={`ml-auto text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-black ${
                          isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info & Storefront Link */}
        <div className="pt-6 border-t border-slate-200 space-y-2.5">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
          >
            <span>Public Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{role === 'ADMIN' ? 'Exit Portal' : 'Sign Out Vendor'}</span>
          </button>
        </div>
      </aside>

      {/* Main Vendor Content Area - White Background Canvas */}
      <main className="flex-1 bg-white p-6 sm:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
