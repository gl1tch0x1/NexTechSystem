import React from 'react';
import Link from 'next/link';
import { FileText, ShieldAlert, Scale, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Terms of Enterprise SLA & Service Agreement | NexTech Systems',
  description: 'Enterprise procurement terms, commercial sales agreements, hardware quotation rules, and SLA commitments.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      {/* Hero Header */}
      <div className="space-y-3 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold">
          <Scale className="w-3.5 h-3.5" />
          <span>Commercial SLA &amp; Master Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Terms of Enterprise Service
        </h1>
        <p className="text-xs text-slate-500 font-mono">
          Effective Date: March 2026 • Jurisdiction: Dubai International Financial Centre (DIFC) / UAE Commercial Courts
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">1. Agreement to Terms</h2>
          <p>
            By accessing the NexTech Systems platform, placing procurement orders, or creating enterprise reseller accounts, your corporate entity agrees to be bound by these Master Terms of Service, along with our <Link href="/privacy" className="text-purple-600 dark:text-purple-400 underline">Privacy Policy</Link> and <Link href="/warranty" className="text-purple-600 dark:text-purple-400 underline">Hardware Warranty Policy</Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">2. Quotations, Pricing &amp; Authoritative VAT</h2>
          <ul className="list-disc pl-5 space-y-2 text-xs">
            <li>All catalog prices are quoted in UAE Dirhams (AED) as standard, convertible dynamically for international clients.</li>
            <li>In accordance with UAE Federal Decree-Law No. 8 of 2017 on Value Added Tax, taxable supplies within the state incur a standard 5% VAT, broken down explicitly on every Electronic Tax Invoice (E-Bill).</li>
            <li>Hardware quotations remain valid for a period of seven (7) business days due to fluctuating global semiconductor supply chains and memory spot pricing.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">3. Inventory Reservation &amp; Order Execution</h2>
          <p>
            Orders placed via the digital storefront, customer cart, or direct administrative sales order creator represent binding purchase offers. Hardware stock allocation is secured upon payment confirmation or authorized corporate credit clearance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">4. Multi-Tenant Reseller Obligations</h2>
          <p>
            Authorized resellers utilizing the partner portal agree to provide accurate hardware specifications, adhere to manufacturer Minimum Advertised Price (MAP) policies, and fulfill customer warranties in accordance with standard tier-1 service agreements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, NexTech Systems shall not be liable for any indirect, incidental, or consequential damages resulting from hardware downtime, server migration delays, or third-party telecommunication interruptions.
          </p>
        </section>
      </div>

      {/* Navigation Footer */}
      <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">Looking for shipment coverage and express courier timelines?</span>
        <Link href="/shipping" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
          View Shipping Policy &rarr;
        </Link>
      </div>
    </div>
  );
}
