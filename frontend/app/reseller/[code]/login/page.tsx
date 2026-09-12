'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Store } from 'lucide-react';

export default function ResellerCodeLoginPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string) || 'comnet101';

  useEffect(() => {
    // Graceful automatic forwarding to unified login with reseller pre-selected
    const timer = setTimeout(() => {
      router.push(`/login?reseller=${encodeURIComponent(code)}`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [code, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-purple-600/25">
          <Store className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-purple-600 dark:text-purple-400 font-bold">
            Partner Authorization Portal
          </span>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Access Partner Workspace: <span className="text-purple-600 dark:text-purple-400 uppercase">{code}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Redirecting you to the unified partner authentication gateway...
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/login?reseller=${encodeURIComponent(code)}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/25 w-full cursor-pointer"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secured by NexTech Multi-Tenant RBAC</span>
        </div>
      </div>
    </div>
  );
}
