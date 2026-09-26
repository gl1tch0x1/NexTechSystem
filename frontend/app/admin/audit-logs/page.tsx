'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate, sanitizeCsvField } from '@/lib/utils';
import { AuditLog } from '@/types';
import {
  Activity,
  Search,
  Eye,
  X,
  Terminal,
  RefreshCw,
  Download,
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const res = await ApiClient.get<AuditLog[]>('/admin/audit-logs', { token });
      setLogs(res || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const categories = [
    { id: 'ALL', label: 'All Operations' },
    { id: 'PRODUCT', label: 'Products & Catalog' },
    { id: 'ORDER', label: 'Orders & Quotes' },
    { id: 'RESELLER', label: 'Reseller Network' },
    { id: 'AUTH', label: 'Security & Access' },
  ];

  const filteredLogs = logs.filter(log => {
    const action = log.action?.toLowerCase() || '';
    const email = log.userEmail?.toLowerCase() || '';
    const resource = log.resource?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      action.includes(query) || email.includes(query) || resource.includes(query);

    if (!matchesSearch) return false;

    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'PRODUCT') return resource.includes('product') || action.includes('product');
    if (selectedCategory === 'ORDER') return resource.includes('order') || resource.includes('quote') || action.includes('order');
    if (selectedCategory === 'RESELLER') return resource.includes('reseller') || action.includes('reseller');
    if (selectedCategory === 'AUTH') return resource.includes('user') || action.includes('auth') || action.includes('login') || action.includes('role');

    return true;
  });

  const handleCopyJson = (details: any) => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Actor Email', 'Actor Role', 'Action Event', 'Target Resource', 'Details Payload'];
    const rows = filteredLogs.map(log => [
      sanitizeCsvField(new Date(log.createdAt).toISOString()),
      sanitizeCsvField(log.userEmail || ''),
      sanitizeCsvField(log.userRole || ''),
      sanitizeCsvField(log.action || ''),
      sanitizeCsvField(log.resource || ''),
      sanitizeCsvField(JSON.stringify(log.details || {})),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.map(sanitizeCsvField).join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derive stats
  const uniqueActors = new Set(logs.map(l => l.userEmail).filter(Boolean)).size;
  const productEvents = logs.filter(l => (l.resource?.toLowerCase() || '').includes('product')).length;
  const recentEventsCount = logs.filter(l => {
    const timeDiff = Date.now() - new Date(l.createdAt).getTime();
    return timeDiff <= 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Immutable Compliance &amp; Security Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Enterprise Audit Trail &amp; Security Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Cryptographic ledger tracking price adjustments, inventory alterations, administrative permissions, and B2B vendor security thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isRefreshing}
            className="h-9 px-3.5 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs border border-slate-200 dark:border-slate-700/80 flex items-center gap-2 transition-all shadow-2xs disabled:opacity-50"
            title="Refresh audit ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="h-9 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            TOTAL LOGGED EVENTS
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {logs.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Append-only compliance log</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            UNIQUE ACTORS
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {uniqueActors}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Administrators &amp; system daemons</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            CATALOG ADJUSTMENTS
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {productEvents}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Hardware price &amp; inventory changes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            PAST 24 HOURS
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {recentEventsCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Active telemetry events</div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search audit trail by action, actor email, or resource..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Timestamp</th>
                <th className="py-3.5 px-4 font-bold">Actor &amp; Role</th>
                <th className="py-3.5 px-4 font-bold">Action Event</th>
                <th className="py-3.5 px-4 font-bold">Target Resource</th>
                <th className="py-3.5 px-4 font-bold">Metadata Payload</th>
                <th className="py-3.5 px-4 font-bold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="font-sans text-xs">Querying audit logs ledger...</span>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[170px]">{log.userEmail || 'System'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold">
                          {log.userRole || 'SYS'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                      {log.resource}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                        title="Inspect Event"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 font-sans text-xs">
                    <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    No security audit logs found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT EVENT MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Audit Log Event Payload
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-sans text-[11px] block">Action Event:</span>
                  <div className="font-mono font-bold text-purple-600 dark:text-purple-400 mt-0.5">{selectedLog.action}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-sans text-[11px] block">Timestamp:</span>
                  <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                    {formatDate(selectedLog.createdAt)} {new Date(selectedLog.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-sans text-[11px] block">Actor Identity:</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedLog.userEmail} ({selectedLog.userRole})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-sans text-[11px] block">Target Resource:</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedLog.resource}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-slate-500 dark:text-slate-400 font-sans text-[11px]">JSON Payload Details:</span>
                  <button
                    onClick={() => handleCopyJson(selectedLog.details)}
                    className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-mono font-medium"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono overflow-x-auto max-h-64 custom-scrollbar">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
