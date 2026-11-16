'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  User,
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
  Loader2,
  Send,
  FileCheck2,
  BadgePercent,
  Layers,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-client';

export default function RequestQuotePage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    taxRegistrationNumber: '',
    tradeLicense: '',
    clientReference: '',
    paymentTerms: 'NET_30',
    deliverySLA: 'STANDARD',
    hardwareRequirements: '',
    estimatedQuantity: '10-50 Units',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteSuccess, setQuoteSuccess] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.companyName.trim() || !formData.contactName.trim() || !formData.contactEmail.trim()) {
      setError('Please provide Company Name, Contact Person, and official Business Email.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        companyName: formData.companyName.trim(),
        contactName: formData.contactName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim() || undefined,
        taxRegistrationNumber: formData.taxRegistrationNumber.trim() || undefined,
        tradeLicense: formData.tradeLicense.trim() || undefined,
        clientReference: formData.clientReference.trim() || undefined,
        paymentTerms: formData.paymentTerms,
        deliverySLA: formData.deliverySLA,
        taxTreatment: 'STANDARD_VAT',
        validityDays: 30,
        notes: `Hardware Requirement: ${formData.hardwareRequirements}\nVolume Band: ${formData.estimatedQuantity}\nAdditional Scope: ${formData.notes}`,
        items: [
          {
            description: formData.hardwareRequirements || 'Enterprise Hardware Batch (Quotation Request)',
            quantity: 1,
            unitPrice: 0,
            taxRate: 5,
          },
        ],
      };

      const res = await fetch(getApiUrl('/quotes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to submit quotation request. Please try again.');
      }

      setQuoteSuccess(json.data);
    } catch (err: any) {
      setError(err?.message || 'Network error occurred while submitting quotation request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Stage */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-900">
            <Building2 className="w-3.5 h-3.5" />
            <span>NexTech B2B Corporate Procurement Desk</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Request an Official Corporate Quotation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Direct wholesale pricing, UAE 5% VAT compliant electronic invoices, custom hardware configurations,
            and reserved inventory allocations for enterprise, government, and educational institutions.
          </p>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 shrink-0">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Wholesale Volume Tiers</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Tier-1 direct manufacturer margins for batch server and laptop deployments.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Tax-Compliant TRN Invoices</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Full Federal Tax Authority (FTA) 5% VAT compliant legal electronic billing.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">24h Dubai Hub Dispatch</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                Direct release from JAFZA and Deira logistics centers across UAE and GCC.
              </p>
            </div>
          </div>
        </div>

        {/* Success Card or Form Container */}
        <AnimatePresence mode="wait">
          {quoteSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/40 dark:border-emerald-500/30 shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <FileCheck2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Quotation Request Submitted Successfully
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                  Your corporate RFP has been assigned to a senior NexTech solutions engineer. An official signed PDF quote will be dispatched to your corporate email within 2 to 4 business hours.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Quote Reference:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-cyan-400 text-sm">
                    {quoteSuccess.quoteNumber || `QT-${Date.now().toString(36).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Company:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formData.companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Official Contact:</span>
                  <span className="text-slate-900 dark:text-white">{formData.contactName} ({formData.contactEmail})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">SLA Priority:</span>
                  <span className="text-emerald-600 font-semibold uppercase">{formData.deliverySLA}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setQuoteSuccess(null);
                    setFormData({
                      companyName: '',
                      contactName: '',
                      contactEmail: '',
                      contactPhone: '',
                      taxRegistrationNumber: '',
                      tradeLicense: '',
                      clientReference: '',
                      paymentTerms: 'NET_30',
                      deliverySLA: 'STANDARD',
                      hardwareRequirements: '',
                      estimatedQuantity: '10-50 Units',
                      notes: '',
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Submit Another Quote
                </button>
                <Link
                  href="/products"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-tech-blue text-white text-xs font-bold shadow-md hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Browse Hardware Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xl space-y-6"
            >
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Corporate Identity Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>1. Corporate Entity & Identity</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Company Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Al-Mansoor Cloud Technologies LLC"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tax Registration Number (TRN / VAT)
                    </label>
                    <input
                      type="text"
                      placeholder="15-digit UAE VAT TRN (e.g. 100234567800003)"
                      value={formData.taxRegistrationNumber}
                      onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Trade License / Freezone Registry
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DED-849201 or DAFZA/2026/89"
                      value={formData.tradeLicense}
                      onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Internal PO # / Project Ref
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PRJ-DXB-HPC-2026"
                      value={formData.clientReference}
                      onChange={(e) => setFormData({ ...formData, clientReference: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Procurement Contact Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span>2. Authorized Procurement Officer</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+971 50 123 4567"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Hardware Requirements & Specifications */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span>3. Hardware Requirements & Volume</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Required Systems, SKUs, or Technical Architecture *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g.&#10;1) 20x MSI Vector 16 / Asus ROG Gaming Laptops with RTX 4080&#10;2) 15x Dell XPS 13 or ThinkPad Laptops with 32GB RAM&#10;3) 4x 2U Rackmount Servers with Dual Xeon and 100GbE Switching"
                    value={formData.hardwareRequirements}
                    onChange={(e) => setFormData({ ...formData, hardwareRequirements: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors font-mono leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estimated Order Volume
                    </label>
                    <select
                      value={formData.estimatedQuantity}
                      onChange={(e) => setFormData({ ...formData, estimatedQuantity: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="1-5 Units">1 - 5 Units (Trial / Lab Deployment)</option>
                      <option value="5-20 Units">5 - 20 Units (Departmental)</option>
                      <option value="20-100 Units">20 - 100 Units (Mid-Scale Rollout)</option>
                      <option value="100+ Units">100+ Units (Enterprise Container Batch)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="NET_30">Net 30 Days (Corporate Credit)</option>
                      <option value="NET_60">Net 60 Days (Enterprise Agreement)</option>
                      <option value="PREPAID_WIRE">100% Upfront Bank Wire (Max Discount)</option>
                      <option value="COD">Cash / Cheque On Delivery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Fulfillment SLA
                    </label>
                    <select
                      value={formData.deliverySLA}
                      onChange={(e) => setFormData({ ...formData, deliverySLA: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="STANDARD">Standard UAE Hub (24-48 Hours)</option>
                      <option value="SAME_DAY">Same-Day Express Dubai Dispatch</option>
                      <option value="GCC_CARGO">GCC Regional Cargo (Saudi, Oman, Qatar)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Special Packaging, Imaging, or On-Site Deployment Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Include asset tagging, pre-load enterprise OS image, or palletized delivery to JAFZA warehouse."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Submissions are strictly confidential and protected by NexTech NDA.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-tech-blue hover:bg-blue-600 active:scale-98 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Quotation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Request Official Corporate Quote</span>
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
