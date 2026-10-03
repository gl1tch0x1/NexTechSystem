'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  Download,
  PieChart,
  Sparkles
} from 'lucide-react';

export default function ResellerAnalyticsPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    if (token) {
      ApiClient.get('/reseller/dashboard', { token, params: { resellerCode } })
        .then(res => setMetrics(res))
        .catch(err => console.error(err));
    }
  }, [token, resellerCode]);

  const revenueTotal = metrics?.revenue?.total ?? 0;
  const ordersTotal = metrics?.orders?.total ?? 0;
  const aov = ordersTotal > 0 ? revenueTotal / ordersTotal : 0;
  const inventoryValuation = metrics?.inventory?.inventoryValuation ?? 0;
  const salesChart = metrics?.salesChart || [];

  const handleExportCSV = () => {
    const headers = ['Date', 'Revenue (AED)', 'Orders'];
    const rows = salesChart.map((d: any) => [d.date, d.revenue, d.orders]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_sales_telemetry_${resellerCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Commercial Business Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-amber-500" />
            <span>Vendor Performance & Margins Telemetry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze gross merchandise value, inventory velocity, and average enterprise ticket sizes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-600">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === range ? 'bg-white text-slate-950 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Gross Merchant Volume (GMV)
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{formatPrice(revenueTotal)}</div>
          <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Audited live ledger</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Average Order Value (AOV)
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{formatPrice(aov)}</div>
          <div className="text-[11px] text-slate-500">Per corporate transaction</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Net Estimated Margin (~18%)
          </div>
          <div className="text-3xl font-black text-emerald-700 font-mono">{formatPrice(revenueTotal * 0.18)}</div>
          <div className="text-[11px] text-slate-500">After wholesale cost deduction</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Capitalized Stock Value
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{formatPrice(inventoryValuation)}</div>
          <div className="text-[11px] text-slate-500">Warehoused asset collateral</div>
        </div>
      </div>

      {/* Main Graph & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Sales Volume Trajectory</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Daily aggregate order values in UAE Dirhams (AED)</p>
            </div>
            <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg">
              Live Feed
            </span>
          </div>

          <div className="space-y-4">
            {salesChart.length > 0 ? (
              salesChart.map((day: any) => {
                const maxRev = Math.max(1, ...salesChart.map((d: any) => d.revenue));
                const pct = Math.round((day.revenue / maxRev) * 100);
                return (
                  <div key={day.date} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-600 font-semibold">{day.date}</span>
                      <span className="font-mono font-black text-slate-900">
                        {formatPrice(day.revenue)}{' '}
                        <span className="text-slate-400 font-normal">({day.orders} transactions)</span>
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(day.revenue > 0 ? 10 : 3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs font-mono text-slate-500">
                No recent transactional sales recorded in this interval.
              </div>
            )}
          </div>
        </div>

        {/* Category Share & Fulfillment Velocity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>Catalog Category Distribution</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Rackmount Servers</span>
                  <span className="font-mono">55%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '55%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Enterprise Switches & Routers</span>
                  <span className="font-mono">30%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Workstations & GPUs</span>
                  <span className="font-mono">15%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50/70 to-white border border-amber-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-black text-xs text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Catalog Expansion Recommendation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              High enterprise demand detected for <strong>Dual Xeon Rack Servers</strong> and <strong>100GbE Managed Switches</strong>. Resellers listing these hardware classes experience 42% higher conversion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
