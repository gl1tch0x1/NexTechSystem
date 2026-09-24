'use client';

import React, { useState } from 'react';
import {
  Building2,
  X,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Send
} from 'lucide-react';

interface RequestQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    name: string;
    sku?: string;
    price?: number;
  };
}

export const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    taxRegistrationNumber: '',
    quantity: 5,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const quotePayload = {
      companyName: formData.companyName.trim(),
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      taxRegistrationNumber: formData.taxRegistrationNumber.trim(),
      notes: formData.notes.trim(),
      items: [
        {
          productId: product?.id || 'prod-custom',
          productName: product?.name || 'Custom Hardware Procurement',
          sku: product?.sku || 'SKU-CUSTOM',
          unitPrice: product?.price || 0,
          quantity: formData.quantity,
          discount: 0,
          subtotal: (product?.price || 0) * formData.quantity,
        },
      ],
    };

    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotePayload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmittedQuote(data.data.quoteNumber);
      } else {
        setError(data.error?.message || 'Failed to submit quotation request.');
      }
    } catch (err: any) {
      setError('Network error. Please try again or email enterprise@nextechsystems.ae');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Request Corporate B2B Quotation
              </h3>
              <p className="text-xs text-slate-500">Tier-1 Volume Discounts &amp; Net-30 Invoicing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submittedQuote ? (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Quotation Request Submitted!
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Reference Number:{' '}
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {submittedQuote}
                </span>
              </p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              An enterprise account manager has been assigned. You will receive an official UAE FTA-compliant quotation with bulk discounts and delivery timeline within 4 business hours.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Product Summary Tag */}
            {product && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Selected Hardware</div>
                <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>SKU: {product.sku || 'SKU-GEN'}</span>
                  {product.price && (
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      Standard: AED {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Company / Entity *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Dubai Holding LLC"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Target Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="e.g. Ahmed Al-Maktoum"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="ahmed@company.ae"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+971 50 000 0000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Tax Registration (TRN)
                </label>
                <input
                  type="text"
                  value={formData.taxRegistrationNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRegistrationNumber: e.target.value })
                  }
                  placeholder="100XXXXXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Project Scope / Delivery Requirements
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Specify delivery timeline, destination freezone, or custom configuration notes..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Confidential B2B Rate Guarantee</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Submit Quote Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestQuoteModal;
