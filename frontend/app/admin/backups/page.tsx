'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/api-client';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Clock,
  FileCode,
  Layers,
  Sparkles,
  ArrowDownToLine
} from 'lucide-react';

export default function AdminBackupsPage() {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreJson, setRestoreJson] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleDownloadBackup = async () => {
    try {
      setDownloading(true);
      setStatusMessage(null);

      const res = await fetch(getApiUrl('/admin/backup'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Backup export failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `nextech-system-backup-${timestamp}.json`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({
        type: 'success',
        text: `Full atomic database snapshot generated and downloaded successfully as "${filename}".`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to generate atomic backup.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        // Validate JSON structure
        JSON.parse(text);
        setRestoreJson(text);
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: 'The selected file is not a valid JSON snapshot.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreSubmit = async () => {
    if (!restoreJson) return;

    try {
      setRestoring(true);
      setStatusMessage(null);

      const parsedData = JSON.parse(restoreJson);

      const res = await fetch(getApiUrl('/admin/restore'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsedData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to restore database');
      }

      setShowRestoreModal(false);
      setRestoreJson('');
      setFileName('');
      setStatusMessage({
        type: 'success',
        text: `Disaster recovery complete! ${data.message || 'Database successfully restored from snapshot.'}`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error executing disaster recovery restore.',
      });
    } finally {
      setRestoring(false);
    }
  };

  const collections = [
    { name: 'products', label: 'Hardware Products & SKUs', desc: 'Enterprise catalog, pricing, multi-warehouse allocations' },
    { name: 'orders', label: 'Global Commerce Orders', desc: 'Customer orders, e-bills, payment audit records' },
    { name: 'users', label: 'Registered Customers & Admins', desc: 'User credentials, wallet balances, role assignments' },
    { name: 'purchase_orders', label: 'Inventory Purchase Orders', desc: 'Supplier reorders, inbound replenishment batches' },
    { name: 'resellers', label: 'Authorized B2B Resellers', desc: 'Vendor portal accounts, trade tier margins' },
    { name: 'coupons', label: 'Promotion Rebates & Codes', desc: 'Discount matrices, banner promotion flags' },
    { name: 'categories', label: 'Product Taxonomy Tree', desc: 'Hardware classification categories and slugs' },
    { name: 'brands', label: 'Enterprise Hardware Brands', desc: 'OEM manufacturers, logos, partner tiers' },
    { name: 'settings', label: 'System & CMS Configurations', desc: 'Storefront layouts, currencies, cloudflare telemetry' },
    { name: 'audit_logs', label: 'Compliance & Security Logs', desc: 'Immutable administrative audit trail' },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-tech-blue uppercase tracking-widest">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Disaster Recovery &amp; State Persistence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Automated Database Backup &amp; Restore
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create atomic JSON snapshots of all system collections or perform point-in-time disaster recovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRestoreModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Restore from File</span>
          </button>

          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-4 h-4" />
            )}
            <span>Export Live Snapshot</span>
          </button>
        </div>
      </div>

      {/* Alert Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-medium animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800/80 text-red-800 dark:text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div className="flex-1">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Storage Engine</span>
            <HardDrive className="w-4 h-4 text-tech-blue" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">Atomic JSON Filesystem</div>
          <div className="text-xs text-slate-500">Persisted continuously on local SSD mount</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Collections</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">10 Active Stores</div>
          <div className="text-xs text-slate-500">Includes catalog, ledger, users &amp; config</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Disaster RTO Target</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">&lt; 3.0 Seconds</div>
          <div className="text-xs text-slate-500">Zero database schema rebuild required</div>
        </div>
      </div>

      {/* Database Collections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              System Collections Managed in Backups
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each collection is serialized atomically with ISO 8601 timestamps and checksum verification.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-slate-600 dark:text-slate-300">
            Export Format: JSON UTF-8
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {collections.map((col, idx) => (
            <div key={col.name} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono text-xs font-bold">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{col.label}</span>
                    <span className="font-mono text-[11px] text-slate-400 font-normal">({col.name}.json)</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {col.desc}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>SYNCHRONIZED</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Confirm Point-in-Time Restore
                </h3>
                <div className="text-xs text-slate-500">Disaster Recovery Procedure</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Uploading a database snapshot will overwrite matching active database tables. Any uncommitted runtime records created after this snapshot will be replaced.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Backup JSON Snapshot File:
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-tech-blue file:text-white hover:file:bg-blue-600 cursor-pointer"
              />
              {fileName && (
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Loaded file: {fileName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreJson('');
                  setFileName('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestoreSubmit}
                disabled={!restoreJson || restoring}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {restoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Execute Recovery</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
