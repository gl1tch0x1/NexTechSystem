'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { useStaffPresence } from '@/lib/useStaffPresence';
import { Reseller } from '@/types';
import {
  LayoutDashboard,
  Package,
  FileSpreadsheet,
  Boxes,
  Store,
  ShieldCheck,
  ArrowLeft,
  Settings,
  Plus,
  CheckCircle2,
  ExternalLink,
  LogOut,
  Clock,
  Menu,
  X
} from 'lucide-react';

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const resellerCode = (params.code as string)?.toLowerCase();
  const { user, role, reseller, token, logout, isLoading } = useAuth();
  const [resellerData, setResellerData] = useState<Reseller | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Send live presence heartbeat for active reseller sessions
  useStaffPresence({ autoPoll: false });

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
      title: 'Hardware Catalog',
      items: [
        { href: `/reseller/${resellerCode}/dashboard`, label: 'Command Center', icon: LayoutDashboard },
        { href: `/reseller/${resellerCode}/products`, label: 'Hardware SKUs & Matrix', icon: Package },
        { href: `/reseller/${resellerCode}/products/new`, label: 'Add New Hardware SKU', icon: Plus, badge: 'STUDIO' },
        { href: `/reseller/${resellerCode}/products/import`, label: 'Excel Bulk Ingestion', icon: FileSpreadsheet, badge: 'XLSX' },
      ]
    },
    {
      title: 'Warehousing & Operations',
      items: [
        { href: `/reseller/${resellerCode}/inventory`, label: 'Warehousing & Stock Control', icon: Boxes },
        { href: `/reseller/${resellerCode}/settings`, label: 'Vendor Store & Compliance', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Mobile Top Navigation Bar (Visible on < md) */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
              {resellerData?.logo || user?.avatar ? (
                <img
                  src={resellerData?.logo || user?.avatar}
                  alt={resellerData?.displayName || 'Vendor Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
                {resellerData?.displayName || reseller?.displayName || 'Vendor Portal'}
              </div>
              <div className="text-[10px] font-mono text-amber-700 truncate">
                {resellerCode}.store.com
              </div>
            </div>
          </div>
        </div>

        <Link
          href={`/reseller/${resellerCode}/products/new`}
          className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-2xs shrink-0"
          title="Add Hardware Product SKU"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </header>

      {/* Backdrop overlay on mobile when drawer is open */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Reseller Left Sidebar - Slide-in Drawer on mobile, persistent column on md+ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shadow-2xl transition-transform duration-300 overflow-y-auto
          md:static md:translate-x-0 md:shadow-sm md:w-72 md:shrink-0 md:z-auto
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-6">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex md:hidden items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
              Vendor Navigation
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

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
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-700 hover:underline"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Master Admin</span>
              </Link>
            </div>
          )}

          {/* Vendor Brand Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm shrink-0 overflow-hidden">
              {resellerData?.logo || user?.avatar ? (
                <img
                  src={resellerData?.logo || user?.avatar}
                  alt={resellerData?.displayName || 'Vendor Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-6 h-6" />
              )}
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
            {resellerData?.status === 'PENDING_APPROVAL' ? (
              <span className="font-mono font-bold text-amber-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500 inline animate-pulse" />
                <span>PENDING VETTING</span>
              </span>
            ) : (
              <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>ISOLATED</span>
              </span>
            )}
          </div>

          {/* Quick SKU Creation CTA Button */}
          {resellerData?.status === 'PENDING_APPROVAL' ? (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 cursor-not-allowed">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Verification Pending</span>
            </div>
          ) : (
            <Link
              href={`/reseller/${resellerCode}/products/new`}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Hardware Product SKU</span>
            </Link>
          )}

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
                      onClick={() => setMobileMenuOpen(false)}
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
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
          >
            <span>Public Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
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
      <main className="flex-1 min-w-0 bg-white p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {resellerData?.status === 'PENDING_APPROVAL' && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold mt-0.5 shadow-xs">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-sm text-amber-950 tracking-tight">
                    Reseller Account Under Compliance Verification
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200/90 text-amber-950 border border-amber-300">
                    Awaiting Admin Approval
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Your reseller profile is currently getting verified by NexTech Administration. We are authenticating your uploaded <strong>Trade License</strong> and <strong>VAT Registration Certificate</strong> to authorize your merchant account.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Commercial Actions (Catalog, Stock, Orders, Payouts) Locked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    Authentication Standard: FTA UAE &amp; DET Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
