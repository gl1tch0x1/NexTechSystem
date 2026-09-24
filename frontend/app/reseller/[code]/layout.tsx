'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Boxes, Building2, ChevronRight, CircleAlert, ExternalLink, FileSpreadsheet, LayoutDashboard, LogOut, Menu, Package, ShieldCheck, ShoppingBag, Store, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import type { Reseller } from '@/types';

export default function ResellerLayout({ children }: { children: React.ReactNode }) {
  const { code } = useParams<{ code: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, token, logout, isLoading } = useAuth();
  const [profile, setProfile] = useState<Reseller | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const base = `/reseller/${code}`;

  useEffect(() => {
    if (!isLoading && (!user || (role !== 'RESELLER' && role !== 'ADMIN'))) router.replace('/login');
  }, [isLoading, user, role, router]);

  useEffect(() => {
    if (!token || !code || (role !== 'RESELLER' && role !== 'ADMIN')) return;
    let current = true;
    setProfileLoading(true);
    setProfileError('');
    ApiClient.get<Reseller>('/reseller/profile', { token, params: { resellerCode: code } })
      .then(data => {
        if (!current) return;
        if (data.resellerCode.toLowerCase() !== code.toLowerCase()) throw new Error('This partner portal does not match your account.');
        if (data.status !== 'ACTIVE') throw new Error('This partner portal is not active. Contact the administrator for access.');
        setProfile(data);
      })
      .catch(error => { if (current) setProfileError(error instanceof Error ? error.message : 'Unable to load the partner portal.'); })
      .finally(() => { if (current) setProfileLoading(false); });
    return () => { current = false; };
  }, [token, code, role]);

  const links = [
    { href: `${base}/dashboard`, label: 'Overview', icon: LayoutDashboard },
    { href: `${base}/products`, label: 'Hardware SKUs', icon: Package },
    { href: `${base}/products/import`, label: 'Bulk import', icon: FileSpreadsheet },
    { href: `${base}/inventory`, label: 'Inventory', icon: Boxes },
    { href: `${base}/orders`, label: 'Orders', icon: ShoppingBag },
    { href: `${base}/profile`, label: 'Partner profile', icon: Building2 },
  ];
  const activeLink = links.find(link => pathname === link.href);

  if (isLoading || profileLoading || !user || !profile) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      {profileError ? <div className="max-w-md rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm dark:border-red-900 dark:bg-slate-900"><CircleAlert className="mx-auto mb-3 h-9 w-9 text-red-500" /><h1 className="text-lg font-bold text-slate-950 dark:text-white">Portal unavailable</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{profileError}</p><Link href={role === 'ADMIN' ? '/admin/resellers' : '/login'} className="mt-5 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">Go back</Link></div> : <p role="status" className="text-sm font-medium text-slate-500">Loading partner workspace…</p>}
    </div>;
  }

  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    {menuOpen && <button aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950"><Store className="h-5 w-5" /></div><div className="min-w-0"><p className="truncate text-sm font-black">{profile.displayName || profile.businessName}</p><p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">Partner workspace</p></div></div><button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="rounded-lg p-1 text-slate-500 lg:hidden"><X className="h-5 w-5" /></button></div>
      <div className="mx-4 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Active reseller</p><p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{profile.resellerCode}</p></div>
      {role === 'ADMIN' && <div className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"><span className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" /> Administrator view</span><Link href="/admin/resellers" className="mt-2 inline-flex items-center gap-1 underline"><ArrowLeft className="h-3 w-3" /> Back to resellers</Link></div>}
      <nav aria-label="Reseller navigation" className="mt-7 flex-1 space-y-1 overflow-y-auto px-3"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>{links.map(({ href, label, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon className="h-4 w-4" />{label}{active && <ChevronRight className="ml-auto h-4 w-4" />}</Link>; })}</nav>
      <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-800"><Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ExternalLink className="h-4 w-4" /> Public storefront</Link><button type="button" onClick={() => { logout(); router.replace('/login'); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>
    <div className="lg:pl-72"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 lg:px-10"><div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"><Menu className="h-5 w-5" /></button><div className="min-w-0"><p className="truncate text-sm font-bold">{activeLink?.label || 'Partner workspace'}</p><p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{profile.businessName}</p></div></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Active partner</span></header><main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main></div>
  </div>;
}
