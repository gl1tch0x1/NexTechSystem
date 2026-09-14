'use client';

import React, { useRef, useState } from 'react';
import { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  Printer,
  X,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Download,
  Copy,
  Check,
  QrCode,
  FileText,
  Mail
} from 'lucide-react';

interface DigitalEBillModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DigitalEBillModal({ order, isOpen, onClose }: DigitalEBillModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen || !order) return null;

  const invoiceNumber =
    order.eBillId ||
    `INV-2026-${order.orderNumber.replace(/[^0-9]/g, '').slice(-6) || '288154'}`;
  const issueDate = formatDate(order.createdAt);
  const subtotalExVat = order.subtotal ? order.subtotal / 1.05 : order.total / 1.05;
  const vatAmount = order.tax > 0 ? order.tax : (order.total - subtotalExVat);
  const trnNumber = '100482910300003';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/orders/${order.id}/invoice`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSimulateEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3500);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(order, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${invoiceNumber}_Verified_EBill.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex justify-center items-start p-2 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white animate-fadeIn">
      {/* Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col my-auto overflow-hidden print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Actions Bar (Hidden on Print) */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold tracking-wider">
                Official Digital E-Bill
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {invoiceNumber} • {order.orderNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy public invoice verification link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied' : 'Share Link'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Download Raw JSON E-Bill"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleSimulateEmail}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Dispatch E-Bill to Customer Email"
            >
              <Mail className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              aria-label="Close invoice preview"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {emailSent && (
          <div className="bg-emerald-500 text-white text-xs font-bold py-2 px-6 text-center animate-fadeIn print:hidden">
            ✓ Digital E-Bill & PDF Receipt dispatched to customer email: {order.customerEmail}
          </div>
        )}

        {/* Printable Tax Invoice Surface */}
        <div id="digital-ebill-printable" className="p-6 sm:p-10 bg-white text-slate-900 overflow-y-auto max-h-[85vh] print:max-h-none print:p-8 print:overflow-visible custom-scrollbar">
          {/* Top Header & Bilingual Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  N
                </div>
                <div>
                  <div className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    NexTech Systems FZ-LLC
                  </div>
                  <div className="text-[10px] font-mono text-purple-700 font-bold uppercase tracking-wider">
                    Enterprise Computer & Technology Infrastructure
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 pt-2 space-y-0.5 font-medium">
                <div>Tower 4, Suite 1200, Business Bay, Dubai, United Arab Emirates</div>
                <div>P.O. Box 85412 • Phone: +971 4 800 TECH (8324)</div>
                <div>Web: https://nextechsystems.ae • Email: billing@nextechsystems.ae</div>
                <div className="text-slate-900 font-mono font-bold pt-1">
                  Tax Registration Number (TRN): <span className="text-purple-700">{trnNumber}</span>
                </div>
              </div>
            </div>

            {/* Invoice Metadata Box */}
            <div className="text-left sm:text-right space-y-1 sm:self-end">
              <div className="inline-block bg-purple-50 border border-purple-200 px-3 py-1 rounded-lg text-right mb-2">
                <div className="text-sm font-black text-purple-900">فاتورة ضريبية رسمية</div>
                <div className="text-xs font-black text-purple-700 tracking-wider">TAX INVOICE</div>
              </div>
              <div className="text-xs">
                <span className="text-slate-500 font-medium">Invoice No:</span>{' '}
                <strong className="font-mono text-slate-900 font-black">{invoiceNumber}</strong>
              </div>
              <div className="text-xs">
                <span className="text-slate-500 font-medium">Order Reference:</span>{' '}
                <strong className="font-mono text-slate-800">{order.orderNumber}</strong>
              </div>
              <div className="text-xs">
                <span className="text-slate-500 font-medium">Invoice Date:</span>{' '}
                <strong className="text-slate-800">{issueDate}</strong>
              </div>
              <div className="text-xs">
                <span className="text-slate-500 font-medium">Payment Mode:</span>{' '}
                <strong className="font-mono text-slate-800">{order.paymentMethod || 'CREDIT_CARD'}</strong>
              </div>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>PAYMENT: {order.paymentStatus || 'PAID'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Consignee / Bill To Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Customer Consignee (Bill To / Ship To)
              </div>
              <div className="text-sm font-black text-slate-900">{order.customerName}</div>
              <div className="text-slate-600 font-medium">{order.customerEmail}</div>
              <div className="text-slate-600 font-medium">{order.customerPhone || '+971 4 800 TECH'}</div>
              {order.shippingAddress && (
                <div className="text-slate-700 pt-1">
                  <div>{order.shippingAddress.addressLine1}</div>
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state || ''} {order.shippingAddress.postalCode || ''}</div>
                  <div className="font-bold">{order.shippingAddress.country || 'United Arab Emirates'}</div>
                </div>
              )}
            </div>

            <div className="space-y-1 sm:text-right sm:border-l sm:border-slate-100 sm:pl-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fulfillment & Warranty Terms
              </div>
              <div className="font-bold text-slate-800">Dispatch Hub: Dubai South Logistics City</div>
              <div className="text-slate-600">Standard Warranty: 24 Months Manufacturer Direct</div>
              <div className="text-slate-600">Currency: United Arab Emirates Dirham (AED)</div>
              <div className="text-slate-600">Fulfillment Status: <strong>{order.orderStatus || order.status || 'PROCESSING'}</strong></div>
            </div>
          </div>

          {/* Hardware Line Items Table */}
          <div className="py-6 border-b border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 text-[10px] uppercase font-bold text-slate-500">
                  <th className="py-2.5 px-2 w-8">#</th>
                  <th className="py-2.5 px-2">Hardware Item & Specifications</th>
                  <th className="py-2.5 px-2">SKU</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-center">VAT %</th>
                  <th className="py-2.5 px-2 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      {item.serialNumbers && item.serialNumbers.length > 0 ? (
                        <div className="text-[10px] font-mono text-purple-700 pt-0.5 font-bold">
                          S/N: {item.serialNumbers.join(', ')}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                          S/N: Verified Hardware Unit
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-[11px] text-slate-500">{item.sku || 'SKU-HW'}</td>
                    <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-700">
                      AED {((item.unitPrice || 0) / 1.05).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-500">5%</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                      {formatPrice(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Summary and Settlement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 items-start">
            {/* Digital Verification & Stamp */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0">
                {/* SVG Simulated FTA Compliant QR Code */}
                <svg className="w-20 h-20 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  {/* Position detection patterns */}
                  <rect x="5" y="5" width="28" height="28" fill="black" />
                  <rect x="9" y="9" width="20" height="20" fill="white" />
                  <rect x="13" y="13" width="12" height="12" fill="black" />

                  <rect x="67" y="5" width="28" height="28" fill="black" />
                  <rect x="71" y="9" width="20" height="20" fill="white" />
                  <rect x="75" y="13" width="12" height="12" fill="black" />

                  <rect x="5" y="67" width="28" height="28" fill="black" />
                  <rect x="9" y="71" width="20" height="20" fill="white" />
                  <rect x="13" y="75" width="12" height="12" fill="black" />

                  {/* QR Data Matrix dots */}
                  <rect x="38" y="10" width="6" height="6" />
                  <rect x="48" y="10" width="6" height="6" />
                  <rect x="58" y="16" width="6" height="6" />
                  <rect x="38" y="24" width="6" height="6" />
                  <rect x="48" y="24" width="6" height="6" />

                  <rect x="10" y="38" width="6" height="6" />
                  <rect x="24" y="38" width="6" height="6" />
                  <rect x="38" y="38" width="6" height="6" />
                  <rect x="48" y="38" width="6" height="6" />
                  <rect x="58" y="38" width="6" height="6" />
                  <rect x="68" y="38" width="6" height="6" />
                  <rect x="82" y="38" width="6" height="6" />

                  <rect x="10" y="48" width="6" height="6" />
                  <rect x="24" y="48" width="6" height="6" />
                  <rect x="38" y="48" width="6" height="6" />
                  <rect x="68" y="48" width="6" height="6" />
                  <rect x="82" y="48" width="6" height="6" />

                  <rect x="38" y="58" width="6" height="6" />
                  <rect x="58" y="58" width="6" height="6" />
                  <rect x="78" y="58" width="6" height="6" />

                  <rect x="38" y="68" width="6" height="6" />
                  <rect x="48" y="68" width="6" height="6" />
                  <rect x="68" y="68" width="6" height="6" />
                  <rect x="82" y="68" width="6" height="6" />

                  <rect x="48" y="78" width="6" height="6" />
                  <rect x="58" y="78" width="6" height="6" />
                  <rect x="78" y="78" width="6" height="6" />

                  <rect x="38" y="88" width="6" height="6" />
                  <rect x="68" y="88" width="6" height="6" />
                  <rect x="82" y="88" width="6" height="6" />
                </svg>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>FTA Verified Tax E-Bill</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Scannable e-invoice verification seal. Complies with Federal Tax Authority (FTA) Cabinet Decision No. (52) of 2017 on Value Added Tax.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Reference: {order.orderNumber}
                </div>
              </div>
            </div>

            {/* Financial Calculations Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Total Taxable Amount (Excl. VAT):</span>
                <span className="font-mono font-bold text-slate-900">
                  AED {subtotalExVat.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Value Added Tax (VAT 5%):</span>
                <span className="font-mono font-bold text-purple-700">
                  AED {vatAmount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                  <span>Promotional Coupon Discount:</span>
                  <span className="font-mono font-bold">- {formatPrice(order.discount)}</span>
                </div>
              )}
              {order.walletAmountUsed > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-purple-600">
                  <span>Wallet Credits Applied:</span>
                  <span className="font-mono font-bold">- {formatPrice(order.walletAmountUsed)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                <span>Standard Logistics & Freight:</span>
                <span className="font-mono font-bold text-slate-900">
                  {order.shippingFee > 0 ? formatPrice(order.shippingFee) : 'FREE (AED 0.00)'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                <span>Net Total Settlement (Incl. VAT):</span>
                <span className="font-mono text-base text-emerald-700">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer Legal Notes */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1">
            <div>
              This is a computer-generated tax invoice verified under UAE Federal Decree Law. No physical signature is required.
            </div>
            <div>
              For corporate returns, warranty inquiries, or business credit adjustments, contact <strong>support@nextechsystems.ae</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
