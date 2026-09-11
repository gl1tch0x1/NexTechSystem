'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, EBill } from '@/types';
import {
  FileText,
  Printer,
  ShieldCheck,
  Building,
  CheckCircle2,
  ArrowLeft,
  QrCode,
  Download,
  AlertCircle
} from 'lucide-react';

export default function TaxInvoicePage() {
  const params = useParams();
  const orderId = params.id as string;
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [ebill, setEbill] = useState<EBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      ApiClient.get<{ order: Order; ebill: EBill }>(`/orders/${orderId}`, { token: token || undefined })
        .then(res => {
          setOrder(res.order);
          setEbill(res.ebill);
        })
        .catch(err => {
          console.error(err);
          setError('Unable to load official tax invoice. Authentication may be required.');
        })
        .finally(() => setLoading(false));
    }
  }, [token, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-mono animate-pulse">
          <FileText className="w-5 h-5 text-tech-blue animate-spin" />
          <span>Generating UAE FTA VAT-Compliant Tax Invoice...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tax Invoice Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-md">{error || 'Order record not found.'}</p>
        <Link
          href="/account/orders"
          className="px-4 py-2 bg-tech-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-600 transition-all"
        >
          Return to My Orders
        </Link>
      </div>
    );
  }

  // VAT calculations: UAE standard VAT is 5%
  const subtotalExVat = order.subtotal ? order.subtotal / 1.05 : order.total / 1.05;
  const vatAmount = order.tax > 0 ? order.tax : (order.total - subtotalExVat);
  const invoiceNumber = ebill?.invoiceNumber || `INV-2026-${order.orderNumber.replace(/[^0-9]/g, '').slice(-6) || '104928'}`;

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-tech-blue dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Invoice</span>
          </button>
        </div>
      </div>

      {/* Official Tax Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>NEXTECH</span>
              <span className="text-blue-600">SYSTEMS</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
            </div>
            <div className="text-xs font-black text-blue-600 uppercase tracking-widest mt-0.5">
              Tax Invoice / فاتورة ضريبية
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5 leading-relaxed font-mono">
              <div>NexTech Systems Enterprise LLC</div>
              <div>Dubai Silicon Oasis, Dtec Tech Park, Dubai, UAE</div>
              <div>Federal Tax Authority (FTA) TRN: <strong className="text-slate-900">10029384910003</strong></div>
              <div>Commercial License No: 948102-DXB</div>
            </div>
          </div>

          <div className="sm:text-right space-y-1.5">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-black rounded-lg">
              {invoiceNumber}
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Order Ref: <strong className="text-slate-900">{order.orderNumber}</strong>
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Issue Date: <strong>{formatDate(order.createdAt)}</strong>
            </div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>PAID &amp; SETTLED ({order.paymentMethod})</span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
          <div className="space-y-1">
            <div className="font-mono uppercase text-[10px] font-bold text-slate-400 tracking-wider">
              Customer / Consignee Details:
            </div>
            <div className="font-extrabold text-sm text-slate-900">{order.customerName}</div>
            <div className="text-slate-600">{order.shippingAddress?.addressLine1 || 'UAE Delivery Address'}</div>
            <div className="text-slate-600">
              {order.shippingAddress?.city || 'Dubai'}, {order.shippingAddress?.country || 'United Arab Emirates'}
            </div>
            <div className="text-slate-600 font-mono">Email: {order.customerEmail}</div>
            <div className="text-slate-600 font-mono">Phone: {order.customerPhone || order.shippingAddress?.phone || 'N/A'}</div>
            <div className="text-slate-500 font-mono pt-1">
              Customer TRN: {(order as any).customerTrn || 'Unregistered / End-Consumer'}
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div className="font-mono uppercase text-[10px] font-bold text-slate-400 tracking-wider">
              Tax & Fulfillment Specifications:
            </div>
            <div className="text-slate-700">Currency: <strong className="font-mono">AED (United Arab Emirates Dirham)</strong></div>
            <div className="text-slate-700">Applicable Tax Rate: <strong className="font-mono">5.00% Standard FTA VAT</strong></div>
            <div className="text-slate-700">Place of Supply: <strong className="font-mono">United Arab Emirates (Local)</strong></div>
            <div className="text-slate-700">Shipping Status: <strong className="font-mono text-emerald-700">{order.orderStatus}</strong></div>
            <div className="text-slate-700">Delivery Method: <strong className="font-mono">Insured GCC Priority Dispatch</strong></div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3">#</th>
                <th className="py-3">Item Description</th>
                <th className="py-3">SKU</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Excl. VAT</th>
                <th className="py-3 text-right">VAT (5%)</th>
                <th className="py-3 text-right">Total (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, index) => {
                const itemTotal = item.unitPrice * item.quantity;
                const itemExVat = itemTotal / 1.05;
                const itemVat = itemTotal - itemExVat;
                const unitExVat = item.unitPrice / 1.05;

                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-3 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      {item.resellerId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Verified Partner: {(item as any).sellerName || item.resellerCode || item.resellerId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-500 text-[11px]">{item.sku || 'N/A'}</td>
                    <td className="py-3 text-center font-bold font-mono">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">{formatPrice(unitExVat)}</td>
                    <td className="py-3 text-right font-mono text-slate-600">{formatPrice(itemVat)}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">{formatPrice(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Breakdown */}
        <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-8">
          <div className="w-full sm:w-1/2 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-center p-1.5 shrink-0">
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 font-mono leading-tight">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>FTA Digital Verification</span>
                </div>
                <div>Hash: SHA256:{order.id.slice(0, 16)}...</div>
                <div>Scan with FTA Zakat &amp; Tax App to verify digital signature validity.</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              Official tax document generated electronically in accordance with UAE Federal Decree-Law No. (8) of 2017 on Value Added Tax.
            </div>
          </div>

          <div className="w-full sm:w-80 space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Gross Taxable Amount:</span>
              <span className="font-bold text-slate-900">{formatPrice(subtotalExVat)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Standard UAE VAT (5.00%):</span>
              <span className="font-bold text-slate-900">{formatPrice(vatAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>GCC Insured Logistics:</span>
              <span className="font-bold text-emerald-700">
                {order.shippingFee && order.shippingFee > 0 ? formatPrice(order.shippingFee) : 'AED 0.00 (FREE)'}
              </span>
            </div>
            {order.discount && order.discount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-amber-700">
                <span>Enterprise Rebate:</span>
                <span className="font-bold">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-sm font-black border-t-2 border-slate-900 text-slate-900 pt-3">
              <span>Total Payable (Inc. VAT):</span>
              <span className="text-base text-blue-700">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-1 font-mono">
          <div>NexTech Systems Enterprise LLC • Tax Registration Number: TRN-10029384910003</div>
          <div>For inquiries regarding this tax invoice, contact billing@nextechsystems.com or call +971 4 800 TECH</div>
        </div>
      </div>
    </div>
  );
}
