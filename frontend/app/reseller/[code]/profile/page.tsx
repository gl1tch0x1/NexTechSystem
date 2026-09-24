'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Building2, CircleAlert, IdCard, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import type { Reseller } from '@/types';

function Detail({ label, value }: { label: string; value?: string | number }) {
  return <div className="border-b border-slate-100 py-3.5 last:border-0 dark:border-slate-800"><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-white">{value || 'Not provided'}</dd></div>;
}

export default function ResellerProfilePage() {
  const { code } = useParams<{ code: string }>();
  const { token } = useAuth();
  const [profile, setProfile] = useState<Reseller | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let current = true;
    ApiClient.get<Reseller>('/reseller/profile', { token, params: { resellerCode: code } })
      .then(data => { if (current) setProfile(data); })
      .catch(err => { if (current) setError(err instanceof Error ? err.message : 'Unable to load partner profile.'); });
    return () => { current = false; };
  }, [token, code]);

  const info = profile?.businessInformation;
  return <div className="mx-auto max-w-6xl space-y-6 pb-12"><div className="border-b border-slate-200 pb-6 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Partner identity</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Business profile</h1><p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Your assigned reseller ID and registered business information.</p></div>
    {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><CircleAlert className="h-4 w-4" />{error}</p>}
    {!profile ? !error && <p role="status" className="text-sm text-slate-500">Loading partner profile…</p> : <><div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><IdCard className="h-7 w-7" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Unique reseller ID</p><p className="mt-1 font-mono text-xl font-black">{profile.resellerCode}</p></div></div><span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" />{profile.status}</span></div>
      <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-base font-black"><Building2 className="h-5 w-5 text-amber-600" /> Business & contact</h2><dl className="mt-3"><Detail label="Registered business" value={profile.businessName} /><Detail label="Display name" value={profile.displayName} /><Detail label="Account email" value={profile.email} /><Detail label="Business phone" value={profile.phone} /><Detail label="Business type" value={info?.businessType} /><Detail label="Website" value={info?.website} /></dl></section><section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-base font-black"><MapPin className="h-5 w-5 text-amber-600" /> Registration & operations</h2><dl className="mt-3"><Detail label="Trade license" value={info?.tradeLicense} /><Detail label="License jurisdiction" value={info?.licenseJurisdiction} /><Detail label="Tax registration" value={info?.taxNumber} /><Detail label="Authorized signatory" value={info?.authorizedSignatory} /><Detail label="Dispatch hub" value={info?.dispatchHub} /><Detail label="Approved on" value={profile.approvedAt ? formatDate(profile.approvedAt) : undefined} /></dl></section></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-base font-black">Business overview</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{info?.description || 'No business overview has been added.'}</p><p className="mt-4 text-xs text-slate-500">Registered address: {[profile.address?.addressLine1, profile.address?.addressLine2, profile.address?.city, profile.address?.state, profile.address?.country].filter(Boolean).join(', ') || 'Not provided'}</p></section>
    </>}
  </div>;
}
