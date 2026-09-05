'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { AuditLog } from '@/types';
import { Activity, ShieldCheck, Search, Eye, X, Terminal, Clock, Lock } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (token) {
      ApiClient.get<AuditLog[]>('/admin/audit-logs', { token })
        .then(res => setLogs(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  const filteredLogs = logs.filter(log =>
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.resource?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="text-xs text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
          Immutable Compliance & Security Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Activity className="w-7 h-7 text-purple-400" />
          Enterprise Audit Trail & Security Events
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time recording of price adjustments, inventory alterations, reseller product approvals, and security boundaries.
        </p>
      </div>

      {/* Search */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search audit trail by action, actor email, or resource..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-400 font-mono font-bold">
          {logs.length} Recorded Events
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Timestamp</th>
                <th className="py-3.5 px-4 font-bold">Actor & Role</th>
                <th className="py-3.5 px-4 font-bold">Action Event</th>
                <th className="py-3.5 px-4 font-bold">Target Resource</th>
                <th className="py-3.5 px-4 font-bold">Metadata Payload</th>
                <th className="py-3.5 px-4 font-bold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white">{log.userEmail}</span>
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-purple-300">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-300">{log.resource}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Inspect Event"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No security audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT EVENT MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Audit Log Event Payload
              </h2>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Action Type:</span>
                  <div className="font-mono font-bold text-purple-600 dark:text-purple-300">{selectedLog.action}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Timestamp:</span>
                  <div className="font-mono text-slate-700 dark:text-slate-300">{formatDate(selectedLog.createdAt)}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans">Actor Identity:</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white">{selectedLog.userEmail} ({selectedLog.userRole})</div>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-sans">Raw JSON Details:</span>
                <pre className="mt-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
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
