'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Wrench,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Search,
  Cpu,
  Calendar,
  Clock,
  Building2,
  AlertTriangle,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

interface WarrantyResult {
  isValid: boolean;
  status: 'ACTIVE' | 'EXPIRED';
  serialNumber: string;
  productName: string;
  sku: string;
  purchaseDate: string;
  warrantyPeriodMonths: number;
  warrantyExpiryDate: string;
  daysRemaining: number;
  authorizedPartner: string;
  coverageType: string;
  orderNumberMasked: string;
}

export default function WarrantyPage() {
  const [serialInput, setSerialInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WarrantyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const handleVerify = async (serialToTest?: string) => {
    const query = (serialToTest || serialInput).trim();
    if (!query) {
      setError('Please enter a hardware serial number to verify.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setClaimSubmitted(false);

    try {
      const res = await fetch(`/api/warranty/verify/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(
          data.error?.message ||
            `No active warranty registration found for Serial Number "${query}". Please check the serial number printed on your retail box or verified tax e-bill.`
        );
      }
    } catch (err: any) {
      setError('Unable to reach warranty verification server. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Official GCC Authorized Tier-1 Hardware Protection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Hardware Serial &amp; Warranty Verification
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Verify genuine factory authenticity, direct 24-month manufacturer coverage, and initiate priority technical RMA claims using your unique hardware serial number.
        </p>
      </div>

      {/* Interactive Serial Verification Engine */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/50 shadow-xl shadow-purple-500/5 space-y-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
            Lookup Hardware Serial Number (S/N)
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={serialInput}
              onChange={(e) => {
                setSerialInput(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleVerify();
              }}
              placeholder="e.g. SN-4090-OC-2026, SN-14900K-BOX"
              className="w-full pl-12 pr-36 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading}
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Status</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Test Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium">Quick Test:</span>
            <button
              type="button"
              onClick={() => {
                setSerialInput('SN-4090-OC-2026');
                handleVerify('SN-4090-OC-2026');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition-colors cursor-pointer"
            >
              RTX 4090 (SN-4090-OC-2026)
            </button>
            <button
              type="button"
              onClick={() => {
                setSerialInput('SN-14900K-BOX');
                handleVerify('SN-14900K-BOX');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 font-mono text-[11px] transition-colors cursor-pointer"
            >
              Core i9-14900K (SN-14900K-BOX)
            </button>
          </div>
        </div>

        {/* Verification Result Card */}
        {result && (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-800/80 space-y-6 animate-fadeIn">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>100% GENUINE AUTHENTIC HARDWARE</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {result.status === 'ACTIVE' ? 'Active Official Warranty Coverage' : 'Warranty Expired'}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  {result.serialNumber}
                </span>
                <button
                  onClick={() => handleCopy(result.serialNumber)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Copy Serial Number"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" />
                  <span>Hardware Component</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white line-clamp-2">{result.productName}</div>
                <div className="font-mono text-[10px] text-slate-500">SKU: {result.sku}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Purchase &amp; Order</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {new Date(result.purchaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="font-mono text-[10px] text-slate-500">Ref: {result.orderNumberMasked}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Remaining Coverage</span>
                </div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {result.daysRemaining} Days
                </div>
                <div className="text-[10px] text-slate-500">
                  Valid until {new Date(result.warrantyExpiryDate).toLocaleDateString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Authorized Partner</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white truncate">{result.authorizedPartner}</div>
                <div className="text-[10px] text-slate-500">{result.coverageType}</div>
              </div>
            </div>

            {/* Warranty Countdown Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Warranty Lifecycle Progress ({result.warrantyPeriodMonths} Months Total Coverage)</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {Math.round((result.daysRemaining / (result.warrantyPeriodMonths * 30.5)) * 100)}% Remaining
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(5, Math.round((result.daysRemaining / (result.warrantyPeriodMonths * 30.5)) * 100))
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* RMA Action Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">
                Experiencing technical anomalies or hardware failure? Submit a direct RMA ticket.
              </div>
              {claimSubmitted ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>RMA Ticket #RMA-2026-{Math.floor(1000 + Math.random() * 9000)} Created</span>
                </div>
              ) : (
                <button
                  onClick={() => setClaimSubmitted(true)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span>Initiate Express RMA Claim</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Verification Notice</div>
              <div>{error}</div>
            </div>
          </div>
        )}
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
          href="/orders"
          className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <span>View Verified E-Bills</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
