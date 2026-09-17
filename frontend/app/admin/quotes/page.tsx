'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Building2,
  DollarSign,
  ChevronRight,
  Calendar,
  Layers,
  X,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';
import { Quote, QuoteStatus, QuoteItem } from '@/types';

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'CONVERT' | 'STATUS_CHANGE';
    title: string;
    message: string;
    quote?: Quote;
    targetStatus?: QuoteStatus;
    details?: { label: string; value: string }[];
    confirmLabel: string;
    variant: 'emerald' | 'amber' | 'rose' | 'blue';
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // New Quote Form State
  const [newQuoteData, setNewQuoteData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    taxRegistrationNumber: '',
    notes: '',
    items: [
      {
        productName: 'ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB GDDR6X',
        sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
        quantity: 4,
        unitPrice: 7699,
        discount: 400,
      },
    ],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const safeJson = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch {
        return { success: false, error: { message: 'Invalid JSON payload received.' } };
      }
    }
    const text = await res.text();
    return {
      success: false,
      error: { message: text.slice(0, 150) || `Server response status ${res.status}` },
    };
  };

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/admin/quotes', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await safeJson(res);
      if (data.success && Array.isArray(data.data)) {
        setQuotes(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const executeStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`/api/admin/quotes/${encodeURIComponent(quoteId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await safeJson(res);
      if (data.success) {
        showToast(`Quotation status updated to ${newStatus}`);
        setQuotes((prev) =>
          prev.map((q) => (q.id === quoteId || q.quoteNumber === quoteId ? { ...q, status: newStatus } : q))
        );
        if (selectedQuote && (selectedQuote.id === quoteId || selectedQuote.quoteNumber === quoteId)) {
          setSelectedQuote((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        alert(data.error?.message || 'Failed to update quotation status.');
      }
    } catch (err) {
      console.error('Failed to update quote status:', err);
      alert('Network error while updating quotation status.');
    }
  };

  const requestStatusConfirmation = (quote: Quote, newStatus: QuoteStatus) => {
    if (quote.status === newStatus) return;

    const variantMap: Record<string, 'emerald' | 'amber' | 'rose' | 'blue'> = {
      APPROVED: 'emerald',
      PENDING_REVIEW: 'amber',
      REJECTED: 'rose',
      DRAFT: 'blue',
      CONVERTED: 'emerald',
      EXPIRED: 'amber',
    };

    setConfirmDialog({
      type: 'STATUS_CHANGE',
      title: `Confirm Status Change: ${newStatus}`,
      message: `Are you sure you want to update the status of Quotation ${quote.quoteNumber} (${quote.companyName}) from ${quote.status} to ${newStatus}?`,
      quote,
      targetStatus: newStatus,
      details: [
        { label: 'Quotation Number', value: quote.quoteNumber },
        { label: 'Client Organization', value: quote.companyName },
        { label: 'Current Status', value: quote.status },
        { label: 'Target Status', value: newStatus },
        { label: 'Total Value', value: `AED ${quote.total?.toLocaleString()}` },
      ],
      confirmLabel: `Confirm & Set ${newStatus}`,
      variant: variantMap[newStatus] || 'blue',
      onConfirm: async () => {
        await executeStatusChange(quote.id, newStatus);
      },
    });
  };

  const executeConvertToOrder = async (quote: Quote) => {
    setConvertingId(quote.id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch(`/api/admin/quotes/${encodeURIComponent(quote.id)}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await safeJson(res);
      if (data.success) {
        const orderNum = data.data?.order?.orderNumber || 'ORD-QTE-NEW';
        showToast(`🎉 Success! Quotation converted to verified Sales Order #${orderNum}`);
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === quote.id || q.quoteNumber === quote.quoteNumber
              ? { ...q, status: 'CONVERTED' as QuoteStatus, convertedOrderId: orderNum }
              : q
          )
        );
        if (selectedQuote && (selectedQuote.id === quote.id || selectedQuote.quoteNumber === quote.quoteNumber)) {
          setSelectedQuote((prev) =>
            prev ? { ...prev, status: 'CONVERTED' as QuoteStatus, convertedOrderId: orderNum } : null
          );
        }
      } else {
        alert(data.error?.message || 'Failed to convert quotation.');
      }
    } catch (err) {
      console.error('Conversion failed:', err);
      alert('Error during order conversion. Please try again.');
    } finally {
      setConvertingId(null);
    }
  };

  const requestConvertConfirmation = (quote: Quote) => {
    if (quote.status === 'CONVERTED') {
      showToast(`This quotation was already converted into Sales Order #${quote.convertedOrderId}`);
      return;
    }

    setConfirmDialog({
      type: 'CONVERT',
      title: 'Confirm Sales Order Conversion',
      message: `Are you sure you want to convert Quotation ${quote.quoteNumber} into a binding corporate Sales Order?`,
      quote,
      details: [
        { label: 'Quotation Number', value: quote.quoteNumber },
        { label: 'Corporate Client', value: quote.companyName },
        { label: 'Tax Registration (TRN)', value: quote.taxRegistrationNumber || 'N/A' },
        { label: 'Hardware Line Items', value: `${quote.items?.length || 0} Line Items` },
        { label: 'Total Value (Inc. 5% VAT)', value: `AED ${quote.total?.toLocaleString()}` },
        { label: 'Current Status', value: quote.status },
      ],
      confirmLabel: 'Yes, Convert to Sales Order',
      variant: 'emerald',
      onConfirm: async () => {
        await executeConvertToOrder(quote);
      },
    });
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteData.companyName || !newQuoteData.contactEmail) {
      alert('Please fill company name and contact email.');
      return;
    }

    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuoteData),
      });
      const data = await safeJson(res);
      if (data.success) {
        showToast(`Quotation ${data.data.quoteNumber} created successfully!`);
        setIsNewQuoteModalOpen(false);
        fetchQuotes();
      }
    } catch (err) {
      console.error('Failed to create quote:', err);
    }
  };

  // Filtered quotes
  const filteredQuotes = quotes.filter((q) => {
    const matchesTab = activeTab === 'ALL' || q.status === activeTab;
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // KPI Calculations
  const totalPipeline = quotes.reduce((acc, q) => acc + (q.total || 0), 0);
  const pendingCount = quotes.filter((q) => q.status === 'PENDING_REVIEW').length;
  const approvedCount = quotes.filter((q) => q.status === 'APPROVED').length;
  const convertedCount = quotes.filter((q) => q.status === 'CONVERTED').length;

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-slate-900 text-white border border-purple-500 shadow-2xl flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-xs font-mono font-bold mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>B2B Commercial Sales &amp; Government Tenders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            B2B Corporate Quotations Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage corporate requests, adjust pricing margins, review tax exemptions, and convert approved quotes to sales orders in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewQuoteModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Draft Corporate Quote</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase flex items-center justify-between">
            <span>Corporate Pipeline</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            AED {totalPipeline.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Total active B2B quotations</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase flex items-center justify-between">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-500">Requires margin confirmation</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase flex items-center justify-between">
            <span>Approved Quotes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {approvedCount}
          </div>
          <div className="text-[11px] text-slate-500">Ready for order conversion</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="text-slate-400 text-xs font-bold uppercase flex items-center justify-between">
            <span>Converted to Orders</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {convertedCount}
          </div>
          <div className="text-[11px] text-slate-500">100% fulfillment rate</div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto max-w-full">
          {['ALL', 'PENDING_REVIEW', 'APPROVED', 'CONVERTED', 'REJECTED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, quote #..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Quotes Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Quote Details</th>
                <th className="px-6 py-4">Company &amp; TRN</th>
                <th className="px-6 py-4">Hardware Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Valid Until</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading corporate quotations...</span>
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No quotations found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {q.quoteNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>{q.companyName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {q.contactName} ({q.contactEmail})
                      </div>
                      {q.taxRegistrationNumber && (
                        <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                          TRN: {q.taxRegistrationNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {q.items?.length || 0} Components
                      </span>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {q.items?.[0]?.productName || 'Hardware'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        AED {q.total?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Inc. 5% VAT (AED {q.tax?.toLocaleString()})
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          q.status === 'APPROVED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : q.status === 'CONVERTED'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : q.status === 'PENDING_REVIEW'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {q.status === 'CONVERTED' && <CheckCircle2 className="w-3 h-3" />}
                        <span>{q.status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[11px] text-slate-500">
                      {new Date(q.validUntil).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedQuote(q);
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>

                        {q.status !== 'CONVERTED' && (
                          <button
                            onClick={() => requestConvertConfirmation(q)}
                            disabled={convertingId === q.id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            title="1-Click Convert to Sales Order"
                          >
                            {convertingId === q.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            <span>Convert</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Inspector & Editor Modal */}
      {isEditModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Quote {selectedQuote.quoteNumber}
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                      {selectedQuote.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Client: {selectedQuote.companyName} | {selectedQuote.contactName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Client & Tax Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Corporate Contact</div>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedQuote.contactName}</div>
                  <div className="text-slate-500">{selectedQuote.contactEmail}</div>
                  <div className="text-slate-500">{selectedQuote.contactPhone || 'No phone'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Tax Registration (TRN)</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedQuote.taxRegistrationNumber || 'Exempt / None'}
                  </div>
                  <div className="text-slate-500">UAE FTA Standard 5% VAT</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Quote Validity</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Until {new Date(selectedQuote.validUntil).toLocaleDateString()}
                  </div>
                  <div className="text-slate-500">Net-30 Corporate Terms</div>
                </div>
              </div>

              {/* Hardware Items Breakdown */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Hardware Line Items &amp; Pricing
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5">Component</th>
                        <th className="px-4 py-2.5">Qty</th>
                        <th className="px-4 py-2.5">Unit Price</th>
                        <th className="px-4 py-2.5">Discount</th>
                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedQuote.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                            <div className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</div>
                          </td>
                          <td className="px-4 py-3 font-bold">{item.quantity}</td>
                          <td className="px-4 py-3">AED {item.unitPrice.toLocaleString()}</td>
                          <td className="px-4 py-3 text-emerald-600 font-bold">-AED {item.discount || 0}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                            AED {item.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-bold">AED {selectedQuote.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Total Discount:</span>
                    <span className="font-bold">-AED {selectedQuote.discount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>UAE FTA VAT (5%):</span>
                    <span className="font-bold">AED {selectedQuote.tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping:</span>
                    <span className="font-bold">AED {selectedQuote.shipping?.toLocaleString() || 0}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base font-black text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="text-purple-600 dark:text-purple-400">
                      AED {selectedQuote.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Admin Action &amp; Status</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => requestStatusConfirmation(selectedQuote, 'APPROVED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    Approve Quotation
                  </button>
                  <button
                    onClick={() => requestStatusConfirmation(selectedQuote, 'PENDING_REVIEW')}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                  >
                    Mark Pending Review
                  </button>
                  <button
                    onClick={() => requestStatusConfirmation(selectedQuote, 'REJECTED')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    Reject Quote
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>

              {selectedQuote.status === 'CONVERTED' ? (
                <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Converted to Order #{selectedQuote.convertedOrderId}</span>
                </div>
              ) : (
                <button
                  onClick={() => requestConvertConfirmation(selectedQuote)}
                  disabled={convertingId === selectedQuote.id}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {convertingId === selectedQuote.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>1-Click Convert to Sales Order</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Quote Draft Modal */}
      {isNewQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Draft New Corporate Quotation
              </h3>
              <button
                onClick={() => setIsNewQuoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={newQuoteData.companyName}
                  onChange={(e) => setNewQuoteData({ ...newQuoteData, companyName: e.target.value })}
                  placeholder="e.g. Dubai Future Labs LLC"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuoteData.contactName}
                    onChange={(e) => setNewQuoteData({ ...newQuoteData, contactName: e.target.value })}
                    placeholder="e.g. Tariq Mansoor"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newQuoteData.contactEmail}
                    onChange={(e) => setNewQuoteData({ ...newQuoteData, contactEmail: e.target.value })}
                    placeholder="tariq@company.ae"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newQuoteData.contactPhone}
                    onChange={(e) => setNewQuoteData({ ...newQuoteData, contactPhone: e.target.value })}
                    placeholder="+971 4 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tax Registration (TRN)
                  </label>
                  <input
                    type="text"
                    value={newQuoteData.taxRegistrationNumber}
                    onChange={(e) =>
                      setNewQuoteData({ ...newQuoteData, taxRegistrationNumber: e.target.value })
                    }
                    placeholder="100XXXXXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 space-y-1">
                <div className="font-bold">Initial Line Item:</div>
                <div>4x ASUS ROG Strix RTX 4090 OC (AED 30,396)</div>
                <div className="text-[10px] text-purple-500">More items can be added after creation.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Submit Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmDialog.variant === 'emerald'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : confirmDialog.variant === 'rose'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : confirmDialog.variant === 'amber'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {confirmDialog.type === 'CONVERT' ? (
                  <Zap className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            {confirmDialog.details && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {confirmDialog.details.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 first:pt-0 last:pb-0">
                    <span className="text-slate-500 dark:text-slate-400">{item.label}:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {confirmDialog.type === 'CONVERT' && (
              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-500" />
                <span>
                  Converting will generate an official sales order, lock pricing margins, and issue an FTA compliance tax invoice.
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                id="confirm-action-cancel"
                type="button"
                onClick={() => {
                  if (!confirmLoading) setConfirmDialog(null);
                }}
                disabled={confirmLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="confirm-action-submit"
                type="button"
                onClick={async () => {
                  setConfirmLoading(true);
                  try {
                    await confirmDialog.onConfirm();
                  } finally {
                    setConfirmLoading(false);
                    setConfirmDialog(null);
                  }
                }}
                disabled={confirmLoading}
                className={`px-5 py-2.5 rounded-xl text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  confirmDialog.variant === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/20'
                    : confirmDialog.variant === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-rose-500/20'
                    : confirmDialog.variant === 'amber'
                    ? 'bg-amber-600 hover:bg-amber-700 active:scale-95 shadow-amber-500/20'
                    : 'bg-tech-blue hover:bg-blue-700 active:scale-95 shadow-blue-500/20'
                }`}
              >
                {confirmLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : confirmDialog.type === 'CONVERT' ? (
                  <Zap className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{confirmDialog.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
