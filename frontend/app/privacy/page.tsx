import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, FileCheck, EyeOff, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy & Data Protection | NexTech Systems',
  description: 'Enterprise data protection guidelines, UAE Personal Data Protection Law (PDPL) compliance, and encrypted customer data governance.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-fadeIn">
      {/* Hero Header */}
      <div className="space-y-3 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>UAE PDPL &amp; International Security Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Enterprise Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 font-mono">
          Last Updated: March 2026 • Governing Law: UAE Federal Decree-Law No. 45 of 2021 (PDPL)
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">1. Scope of Privacy Governance</h2>
          <p>
            NexTech Systems Enterprise FZCO (&quot;NexTech Systems&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to upholding the highest standards of confidentiality, data integrity, and compliance across all B2B procurement operations, customer transactions, and web application interactions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">2. Categories of Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-xs">
            <li><strong>Identity &amp; Account Data:</strong> Legal full name, business entity trade name, corporate email address, contact telephone, and role credentials.</li>
            <li><strong>Transactional &amp; E-Bill Records:</strong> Delivery consignee addresses, ordered hardware SKUs, order amounts, and UAE Tax Registration Numbers (TRN).</li>
            <li><strong>Financial Settlements:</strong> Payment method selections, wallet transaction ledgers, and tokenized payment authorization tokens. (Credit card numbers are processed directly via PCI-DSS Level 1 payment gateways and never stored on NexTech servers).</li>
            <li><strong>Telemetry &amp; Security Logs:</strong> IP address, browser user-agent, Cloudflare Ray IDs, session timestamps, and administrative audit log events.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">3. How Information is Utilized</h2>
          <p>
            Personal and business data is processed strictly for:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">Order Fulfillment &amp; E-Bills</span>
              Dispatching hardware components, courier waybills, and issuing verified electronic tax invoices under UAE FTA regulations.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">Security &amp; Threat Mitigation</span>
              Detecting brute-force attacks, DDoS activity, and automated scraping via Cloudflare Turnstile and rate limiting engines.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">4. Tax &amp; Statutory Retention Requirements</h2>
          <p>
            Under UAE Federal Tax Authority (FTA) statutes, commercial records, including electronic tax invoices (E-Bills), VAT calculations, and transaction histories, are securely archived for a minimum statutory duration of five (5) years.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">5. Data Subject Rights &amp; Rectification</h2>
          <p>
            Clients and registered users may inspect, update, or request the export of their profile data directly via their account dashboard or by submitting a formal inquiry to <span className="font-mono text-purple-600 dark:text-purple-400">privacy@nextechsystems.com</span>.
          </p>
        </section>
      </div>

      {/* Footer Note */}
      <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500">Need specific compliance documentation for your enterprise procurement?</span>
        <Link href="/terms" className="font-bold text-purple-600 dark:text-purple-400 hover:underline">
          Review Terms of SLA &rarr;
        </Link>
      </div>
    </div>
  );
}
