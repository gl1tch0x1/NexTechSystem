'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { PurchaseOrder, POStatus } from '@/types';
import {
  Server,
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Boxes,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Ban
} from 'lucide-react';

export default function AdminPurchaseOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(10);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPOs = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/admin/purchase-orders'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPOs();
    }
  }, [token]);

  const handleGenerateLowStock = async () => {
    try {
      setGenerating(true);
      setStatusMessage(null);

      const res = await fetch(getApiUrl('/admin/purchase-orders/generate-low-stock'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ threshold }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to generate reorder batch');
      }

      setStatusMessage({
        type: 'success',
        text: json.message || 'Purchase Order generated successfully!',
      });
      fetchPOs();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to generate low-stock PO',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: POStatus) => {
    try {
      setUpdatingId(id);
      setStatusMessage(null);

      const res = await fetch(getApiUrl(`/admin/purchase-orders/${id}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update PO status');
      }

      setStatusMessage({
        type: 'success',
        text: `PO ${json.data?.poNumber || id} marked as ${newStatus}${newStatus === 'RECEIVED' ? ' — Hardware inventory balances updated!' : '.'}`,
      });
      fetchPOs();
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error updating status',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const exportPoCsv = (po: PurchaseOrder) => {
    const headers = ['PO Number', 'SKU', 'Product Name', 'Quantity', 'Unit Cost', 'Subtotal'];
    const rows = po.items.map(it => [
      po.poNumber,
      `"${it.sku}"`,
      `"${(it.name || it.title || 'Product').replace(/"/g, '""')}"`,
      it.quantity ?? it.orderedQuantity ?? 0,
      it.unitCost,
      it.subtotal ?? it.totalCost ?? 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${po.poNumber}-inventory-manifest.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadge = (status: POStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">DRAFT</span>;
      case 'ISSUED':
        return <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800/60 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">ISSUED</span>;
      case 'RECEIVED':
        return <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> RECEIVED</span>;
      case 'CANCELLED':
        return <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg text-xs font-bold font-mono">CANCELLED</span>;
    }
  };

  const totalValue = orders.reduce((acc, o) => acc + (o.totalEstimatedCost || o.totalCost || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'DRAFT' || o.status === 'ISSUED').length;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-tech-blue uppercase tracking-widest">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Automated Supply Chain &amp; Replenishment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Purchase Orders &amp; Inventory Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Detect low-stock hardware SKUs, automatically calculate restock batches, and replenish inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-2xl text-xs font-bold">
            <span className="text-slate-500">Threshold:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-12 bg-transparent text-slate-900 dark:text-white font-mono font-black focus:outline-none text-center"
            />
            <span className="text-slate-400 text-[11px]">Units</span>
          </div>

          <button
            onClick={handleGenerateLowStock}
            disabled={generating}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Auto-Generate Low-Stock PO</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total POs Created</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{orders.length}</div>
          <div className="text-[11px] text-slate-500">Historical &amp; active supplier orders</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Awaiting Inbound</div>
          <div className="text-2xl font-black text-amber-500 font-mono">{pendingCount}</div>
          <div className="text-[11px] text-slate-500">Drafted or issued to vendors</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Inbound Valuation</div>
          <div className="text-2xl font-black text-tech-blue font-mono">{formatPrice(totalValue)}</div>
          <div className="text-[11px] text-slate-500">Cost valuation across all orders</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Inventory Automation</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">ACTIVE</div>
          <div className="text-[11px] text-slate-500">Auto-restocks on &quot;Received&quot; status</div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Purchase Orders Ledger</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage inbound vendor orders and trigger automatic inventory replenishment.
            </p>
          </div>

          <button
            onClick={fetchPOs}
            className="p-2 rounded-xl text-slate-500 hover:text-tech-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">No Purchase Orders Found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Auto-Generate Low-Stock PO&quot; above to scan all inventory items below the {threshold} unit threshold.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {orders.map(po => {
              const isExpanded = expandedPoId === po.id;
              const isUpdating = updatingId === po.id;

              return (
                <div key={po.id} className="p-5 sm:p-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {po.poNumber}
                        </span>
                        {statusBadge(po.status)}
                        <span className="text-xs text-slate-500 font-mono">
                          Created {formatDate(po.createdAt)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
                        <span>Supplier: <strong className="text-slate-900 dark:text-white">{po.supplierName}</strong></span>
                        <span>•</span>
                        <span>{po.items.length} Line Item(s)</span>
                        <span>•</span>
                        <span>Target: {po.destinationLocation || 'Dubai Logistics Center'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right mr-2">
                        <div className="text-xs text-slate-400 font-medium">Estimated Reorder Cost</div>
                        <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {formatPrice(po.totalEstimatedCost || po.totalCost || 0)}
                        </div>
                      </div>

                      {/* State Pipeline Buttons */}
                      {po.status === 'DRAFT' && (
                        <button
                          onClick={() => handleUpdateStatus(po.id, 'ISSUED')}
                          disabled={isUpdating}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Issue to Supplier</span>
                        </button>
                      )}

                      {po.status === 'ISSUED' && (
                        <button
                          onClick={() => handleUpdateStatus(po.id, 'RECEIVED')}
                          disabled={isUpdating}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive &amp; Stock In</span>
                        </button>
                      )}

                      {po.status !== 'CANCELLED' && po.status !== 'RECEIVED' && (
                        <button
                          onClick={() => handleUpdateStatus(po.id, 'CANCELLED')}
                          disabled={isUpdating}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Cancel PO"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => exportPoCsv(po)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Download CSV Manifest"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isExpanded ? 'Collapse Items' : 'Expand Items'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fadeIn space-y-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Inbound Manifest Items:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                              <th className="pb-2">SKU</th>
                              <th className="pb-2">Product Name</th>
                              <th className="pb-2 text-center">Restock Qty</th>
                              <th className="pb-2 text-right">Unit Cost</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {po.items.map((it, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                <td className="py-2 font-mono text-slate-500">{it.sku}</td>
                                <td className="py-2 font-bold text-slate-900 dark:text-white">{it.name || it.title}</td>
                                <td className="py-2 text-center font-bold font-mono text-blue-600 dark:text-cyan-400">
                                  +{it.quantity ?? it.orderedQuantity ?? 0}
                                </td>
                                <td className="py-2 text-right font-mono">{formatPrice(it.unitCost)}</td>
                                <td className="py-2 text-right font-mono font-bold">{formatPrice(it.subtotal ?? it.totalCost ?? 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
