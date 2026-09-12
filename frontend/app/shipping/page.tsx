import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, Clock, Globe, ArrowRight, Package, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Enterprise Shipping & Logistics Policy | NexTech Systems',
  description: 'Fast, secure hardware dispatch across the UAE, GCC, and global tech corridors. Track shipments, insured transit, and enterprise delivery SLAs.',
};

export default function ShippingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-3 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold">
          <Truck className="w-3.5 h-3.5" />
          <span>Global Logistics & Secure Dispatch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Shipping & Freight Delivery Policy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          High-performance technology demands mission-critical logistics. We provide insured, temperature-regulated, and tracked transit for all microelectronics and enterprise servers.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">UAE Express Same-Day</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Orders confirmed before 12:00 PM GST within Dubai, Abu Dhabi, and Sharjah qualify for same-day white-glove direct courier transit.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">GCC Regional Network</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Expedited customs clearance and direct road-freight / air cargo connections into Saudi Arabia (KSA), Qatar, Kuwait, Bahrain, and Oman (2-4 business days).
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Full Value Transit Insurance</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Every shipment containing GPUs, server processors, and custom workstations is covered by full comprehensive carrier insurance against loss or damage.
          </p>
        </div>
      </div>

      {/* Tier Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Dispatch Tiers & Shipping Rates</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="pb-3">Logistics Tier</th>
                <th className="pb-3">Coverage Area</th>
                <th className="pb-3">Estimated Time</th>
                <th className="pb-3 text-right">Standard Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              <tr>
                <td className="py-3 font-bold text-slate-900 dark:text-white">UAE Standard Dispatch</td>
                <td className="py-3">All 7 Emirates</td>
                <td className="py-3">1-2 Business Days</td>
                <td className="py-3 text-right font-mono font-bold">AED 25.00</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-slate-900 dark:text-white">UAE Express Same-Day</td>
                <td className="py-3">Dubai, Abu Dhabi, Sharjah</td>
                <td className="py-3">4-8 Hours</td>
                <td className="py-3 text-right font-mono font-bold">AED 50.00</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-slate-900 dark:text-white">Enterprise Bulk / Free Tier</td>
                <td className="py-3">UAE National</td>
                <td className="py-3">1-2 Business Days</td>
                <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">FREE (Orders &gt; AED 5,000)</td>
              </tr>
              <tr>
                <td className="py-3 font-bold text-slate-900 dark:text-white">GCC Air Cargo Courier</td>
                <td className="py-3">Saudi Arabia, Qatar, Kuwait, Oman, Bahrain</td>
                <td className="py-3">2-4 Business Days</td>
                <td className="py-3 text-right font-mono font-bold">Calculated at Checkout</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/40 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Have questions regarding enterprise freight or bulk pallet delivery?</h3>
          <p className="text-xs text-slate-300">Contact our 24/7 dedicated logistics desk for expedited container or freight quotes.</p>
        </div>
        <Link
          href="/account/orders"
          className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-lg shadow-purple-600/25"
        >
          <span>Track Active Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
