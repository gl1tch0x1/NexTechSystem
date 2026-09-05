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
  Store,
  CheckCircle2,
  Clock,
  Truck,
  ArrowLeft
} from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [ebill, setEbill] = useState<EBill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && orderId) {
      ApiClient.get<{ order: Order; ebill: EBill }>(`/orders/${orderId}`, { token })
        .then(res => {
          setOrder(res.order);
          setEbill(res.ebill);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token, orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-slate-400">
        Loading invoice details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Not Found</h2>
        <p className="text-xs text-slate-400">The requested order was not found or belongs to another user.</p>
        <Link href="/account/orders" className="text-xs font-bold text-tech-blue hover:underline">
          Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Controls Bar */}
      <div className="no-print flex items-center justify-between pb-6 border-b border-slate-200 dark:border-tech-slate">
        <Link
          href="/account/orders"
          className="text-xs text-slate-400 hover:text-tech-blue flex items-center gap-1.5 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-tech"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Download PDF E-Bill</span>
        </button>
      </div>

      {/* Printable Electronic Tax Invoice (E-Bill) Container */}
      <div
        id="printable-ebill"
        className="p-8 sm:p-12 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl space-y-8"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900">
              NEXTECH<span className="text-blue-600">SYSTEMS</span>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Official Electronic Tax Invoice
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              <div>NexTech Systems LLC • Silicon Oasis Tech Park, Dubai, UAE</div>
              <div>Tax Registration Number (TRN): <strong>TRN-10029384910003</strong></div>
              <div>Support: support@nextechsystems.com • +971 4 800 TECH</div>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded">
              {ebill?.invoiceNumber || `INV-2026-${order.orderNumber.slice(-6)}`}
            </div>
            <div className="text-xs text-slate-600">
              Order Ref: <strong>{order.orderNumber}</strong>
            </div>
            <div className="text-xs text-slate-600">
              Issue Date: <strong>{formatDate(order.createdAt)}</strong>
            </div>
            <div className="text-xs font-bold text-emerald-600 uppercase mt-1">
              Payment Status: {order.paymentStatus} ({order.paymentMethod})
            </div>
          </div>
        </div>

        {/* Consignee & Shipping Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-700">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1">
              Billed & Shipped To:
            </div>
            <div className="font-extrabold text-sm text-slate-900">{order.customerName}</div>
            <div>{order.shippingAddress.addressLine1}</div>
            <div>{order.shippingAddress.city}, {order.shippingAddress.country}</div>
            <div>Phone: {order.customerPhone || order.shippingAddress.phone}</div>
            <div>Email: {order.customerEmail}</div>
          </div>

          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1">
              Fulfillment & Dispatch:
            </div>
            <div>Status: <strong className="text-slate-900">{order.orderStatus}</strong></div>
            <div>Carrier: Insured GCC Express Logistics</div>
            <div>Estimated Delivery: 1 - 2 Business Days</div>
            {order.notes && (
              <div className="mt-2 text-slate-500 italic">
                Notes: &ldquo;{order.notes}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3">Item & Technical Description</th>
                <th className="py-3">SKU</th>
                <th className="py-3">Seller Attribution</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 pr-2 font-bold text-slate-900">
                    {item.productName}
                  </td>
                  <td className="py-3.5 font-mono text-slate-500">{item.sku}</td>
                  <td className="py-3.5">
                    {item.sellerType === 'RESELLER' ? (
                      <span className="font-semibold text-amber-700">Reseller: {item.resellerCode}</span>
                    ) : (
                      <span className="font-semibold text-blue-700">NexTech Official</span>
                    )}
                  </td>
                  <td className="py-3.5 text-center font-bold">{item.quantity}</td>
                  <td className="py-3.5 text-right font-mono">{formatPrice(item.unitPrice)}</td>
                  <td className="py-3.5 text-right font-mono font-bold text-slate-900">
                    {formatPrice(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals Calculation Box */}
        <div className="flex justify-end pt-4 border-t-2 border-slate-200">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Gross Subtotal:</span>
              <span className="font-mono font-bold">{formatPrice(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex items-center justify-between text-emerald-600 font-bold">
                <span>Coupon Discount ({order.couponCode || 'PROMO'}):</span>
                <span className="font-mono">-{formatPrice(order.discount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span>Insured Shipping Fee:</span>
              <span className="font-mono font-bold">
                {order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>UAE VAT ({order.taxRate}% Included):</span>
              <span className="font-mono font-bold">{formatPrice(order.tax)}</span>
            </div>

            {order.walletAmountUsed > 0 && (
              <div className="flex items-center justify-between text-blue-600 font-bold">
                <span>Customer Wallet Deduction:</span>
                <span className="font-mono">-{formatPrice(order.walletAmountUsed)}</span>
              </div>
            )}

            <div className="pt-3 border-t-2 border-slate-900 flex items-baseline justify-between text-sm">
              <span className="font-black text-slate-900">Net Invoice Total:</span>
              <span className="text-xl font-black font-mono text-slate-900">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimers & Official Seal */}
        <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div>This is an official system-generated electronic tax invoice authorized under UAE VAT legislation.</div>
            <div>All hardware serial numbers are recorded in our audit ledger for warranty validation.</div>
          </div>
          <div className="text-right font-mono font-bold text-slate-400">
            CONFIRMATION SEAL: {order.id.slice(0, 16).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
