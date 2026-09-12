import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Award, Wrench, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Hardware Warranty & RMA Claims Policy | NexTech Systems',
  description: 'Enterprise hardware warranty protection, manufacturer RMA support, and rapid component replacement service terms.',
};

export default function WarrantyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-3 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Manufacturer Guaranteed & Genuine Verified</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Hardware Warranty & RMA Claims
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Every component sold through NexTech Systems is guaranteed 100% genuine factory sealed, sourced from authorized global tier-1 distribution channels with full manufacturer warranty.
        </p>
      </div>

      {/* Coverage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Authorized Partner Warranty</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Direct warranty recognition with Intel, AMD, NVIDIA, Asus, Supermicro, Samsung, and Corsair without intermediary registration delays.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">14-Day DOA Fast Replacement</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Dead-On-Arrival (DOA) components reported within 14 days of receipt are instantly replaced from local reserve stock following a bench test.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Hardware RMA Facilitation</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Our engineering lab handles courier pickup, vendor diagnosis, RMA documentation, and replacement tracking end-to-end.
          </p>
        </div>
      </div>

      {/* Typical Durations */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Component Standard Warranty Periods</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Processors (CPUs)</div>
            <div className="text-base font-black text-slate-900 dark:text-white">3 Years</div>
            <div className="text-[11px] text-slate-500">Boxed Intel Core / Xeon &amp; AMD Ryzen / EPYC</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Graphics Accelerators</div>
            <div className="text-base font-black text-slate-900 dark:text-white">3 - 5 Years</div>
            <div className="text-[11px] text-slate-500">GeForce RTX, Radeon PRO, &amp; Ada Workstation</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-bold">PCIe Gen5 &amp; NVMe SSDs</div>
            <div className="text-base font-black text-slate-900 dark:text-white">5 Years</div>
            <div className="text-[11px] text-slate-500">Samsung, Crucial, &amp; Kingston Enterprise (or TBW)</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-bold">Power Supplies (PSUs)</div>
            <div className="text-base font-black text-slate-900 dark:text-white">5 - 10 Years</div>
            <div className="text-[11px] text-slate-500">80 PLUS Gold, Platinum &amp; Titanium certified</div>
          </div>
        </div>
      </div>

      {/* RMA Process Steps */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">How to Initiate an RMA Request</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">1</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Submit Order &amp; Serial #</h3>
            <p className="text-slate-500 leading-relaxed">Locate your E-Bill under your customer dashboard and specify the hardware SKU serial number.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">2</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Lab Diagnostics</h3>
            <p className="text-slate-500 leading-relaxed">Our Dubai service lab tests the component against manufacturer tolerance guidelines within 48 hours.</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">3</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Dispatch Replacement</h3>
            <p className="text-slate-500 leading-relaxed">A factory replacement unit is dispatched via insured courier directly to your consignee address.</p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div>
          <h3 className="text-sm font-bold">Need assistance with an existing hardware serial number?</h3>
          <p className="text-xs text-slate-400">View your digital e-bills and verified purchases directly in your account.</p>
        </div>
        <Link
          href="/account/orders"
          className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <span>View E-Bills</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
