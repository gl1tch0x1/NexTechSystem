'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck
} from 'lucide-react';

export default function ResellerPayoutsPage() {
  const params = useParams();
  const resellerCode = (params.code as string)?.toUpperCase();

  const [payouts] = useState([
    {
      id: 'PAY-DXB-9801',
      period: '15 Sep 2026 - 30 Sep 2026',
      grossSales: 51000.0,
      platformFee: 4080.0, // 8%
      vatWithheld: 2550.0, // 5%
      netRemittance: 44370.0,
      status: 'PAID',
      paidDate: '01 Oct 2026',
      reference: 'WIR-ENBD-771249',
    },
    {
      id: 'PAY-DXB-9802',
      period: '01 Sep 2026 - 15 Sep 2026',
      grossSales: 38400.0,
      platformFee: 3072.0,
      vatWithheld: 1920.0,
      netRemittance: 33408.0,
      status: 'PAID',
      paidDate: '16 Sep 2026',
      reference: 'WIR-ENBD-654921',
    },
    {
      id: 'PAY-DXB-9803',
      period: '01 Oct 2026 - 15 Oct 2026 (Current)',
      grossSales: 29199.3,
      platformFee: 2335.94,
      vatWithheld: 1459.97,
      netRemittance: 25403.39,
      status: 'ACCUMULATING',
      paidDate: 'Estimated 16 Oct 2026',
      reference: 'Pending Cycle Close',
    },
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Commercial Finance & Settlement Ledger • {resellerCode}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-amber-500" />
            <span>Vendor Settlements & Direct Payouts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bi-monthly enterprise wire transfers, platform facilitation fee breakdowns, and UAE VAT remittance documentation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Downloading official Statement of Account (PDF)...')}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Statement of Account (PDF)</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Accumulating Settlement Balance
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{formatPrice(25403.39)}</div>
          <div className="text-[11px] text-amber-900 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Next settlement release: 16 Oct 2026</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Total Disbursed to Date
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono">{formatPrice(77778.0)}</div>
          <div className="text-[11px] text-slate-500">2 electronic funds transfers completed</div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Platform Facilitation Rate
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">8.00%</div>
          <div className="text-[11px] text-slate-500">Standard Tier A Technology Reseller</div>
        </div>
      </div>

      {/* Verified Payout Account Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified UAE Commercial Bank Account on File</span>
          </div>
          <div className="text-base font-black">Emirates NBD Corporate Banking — Dubai Branch</div>
          <div className="text-xs font-mono text-slate-300">
            IBAN: AE28 0260 0001 2948 5710 391 • SWIFT: EBILAEADXXX
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
            Direct Wire Active ✓
          </span>
        </div>
      </div>

      {/* Payout History Ledger */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Settlement Remittance History</h3>
          <span className="text-xs text-slate-500 font-mono">Cycle: Semi-Monthly (Net-15)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Settlement Batch</th>
                <th className="py-3 px-3">Billing Cycle</th>
                <th className="py-3 px-3 text-right">Gross GMV</th>
                <th className="py-3 px-3 text-right">Platform Fee (8%)</th>
                <th className="py-3 px-3 text-right">Net Wire Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Remittance Advice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payouts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-3 font-mono font-bold text-slate-900">{p.id}</td>
                  <td className="py-4 px-3 text-slate-700">{p.period}</td>
                  <td className="py-4 px-3 text-right font-mono font-bold text-slate-900">
                    {formatPrice(p.grossSales)}
                  </td>
                  <td className="py-4 px-3 text-right font-mono text-slate-500">
                    -{formatPrice(p.platformFee)}
                  </td>
                  <td className="py-4 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                    {formatPrice(p.netRemittance)}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                        p.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {p.status === 'PAID' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading Remittance Advice for Batch ${p.id}...`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Advice PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
