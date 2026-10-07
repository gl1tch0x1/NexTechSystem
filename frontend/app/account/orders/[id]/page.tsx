'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, EBill } from '@/types';
import {
  Printer,
  ArrowLeft,
  FileText,
  Truck,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import InvoiceStampSignature from '@/components/invoice/InvoiceStampSignature';
import InvoiceTermsAndConditions from '@/components/invoice/InvoiceTermsAndConditions';

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
    } else if (!token) {
      setLoading(false);
    }
  }, [token, orderId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-xs text-slate-400">
        Loading order and electronic invoice details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Record Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested hardware order could not be located or may belong to another account.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tech-blue text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Orders</span>
        </Link>
      </div>
    );
  }

  const isApproved = order.orderStatus !== 'PENDING_APPROVAL';
  const steps = [
    { label: 'Order Placed', completed: true },
    { label: 'Admin Approval', completed: isApproved, active: order.orderStatus === 'PENDING_APPROVAL' },
    { label: 'Packed & Quality Tested', completed: isApproved && order.orderStatus !== 'PENDING' },
    { label: 'Dispatched with Courier', completed: order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED' },
    { label: 'Delivered', completed: order.orderStatus === 'DELIVERED' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/account" className="hover:text-tech-blue">Account</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/account/orders" className="hover:text-tech-blue">Orders</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-mono font-bold text-slate-900 dark:text-white">{order.orderNumber}</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/orders/${order.id}/invoice`}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Official FTA VAT-Compliant Tax Invoice"
          >
            <FileText className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
            <span>Official FTA Invoice</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print E-Bill (PDF)</span>
          </button>
        </div>
      </div>

      {/* Human-in-the-Loop Pending to Approve Notice */}
      {order.orderStatus === 'PENDING_APPROVAL' && (
        <div className="no-print p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>Order Status: Pending to Approve</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            Your hardware order has been successfully registered and your inventory allocation has been reserved. In accordance with executive enterprise policies, all new purchase orders undergo administrator review before dispatch release. You will receive real-time notification as soon as verification completes.
          </p>
        </div>
      )}

      {/* Real-time Order Progress Stepper (Interactive view) */}
      <div className="no-print p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Shipment Status
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
              <span>{order.orderStatus === 'PENDING_APPROVAL' ? 'Pending to Approve' : order.orderStatus}</span>
              <span className="text-xs font-normal text-slate-500">• Insured Courier Logistics</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Tracking Code</div>
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {(order as any).trackingNumber || `NXT-TRK-${order.id.slice(0, 8).toUpperCase()}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {steps.map((st, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  st.completed
                    ? 'bg-tech-blue text-white shadow-xs'
                    : (st as any).active
                    ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {st.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-xs font-bold ${
                  st.completed
                    ? 'text-slate-900 dark:text-white'
                    : (st as any).active
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Printable Electronic Tax Invoice (E-Bill) Container */}
      <div
        id="printable-ebill"
        className="printable-content printable-invoice p-8 sm:p-12 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
              <span>NEXTECH</span>
              <span className="text-blue-600">SYSTEMS</span>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Official Electronic Tax Invoice & E-Bill
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              <div>NexTech Systems LLC • Silicon Oasis Technology Park, Dubai, UAE</div>
              <div>Tax Registration Number (TRN): <strong>TRN-10029384910003</strong></div>
              <div>Direct Dispatch Center: Dubai Industrial City, Hub 4</div>
              <div>Customer Care: support@nextechsystems.com • +971 4 800 TECH</div>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded">
              {ebill?.invoiceNumber || `INV-2026-${order.orderNumber.replace(/[^0-9]/g, '').slice(-6) || '104928'}`}
            </div>
            <div className="text-xs text-slate-600">
              Order Ref: <strong>{order.orderNumber}</strong>
            </div>
            <div className="text-xs text-slate-600">
              Issue Date: <strong>{formatDate(order.createdAt)}</strong>
            </div>
            <div className={`text-xs font-bold uppercase mt-1 flex items-center sm:justify-end gap-1.5 ${
              order.paymentStatus === 'PAID' ? 'text-emerald-600' :
              order.paymentStatus === 'FAILED' ? 'text-rose-600' :
              order.paymentStatus === 'AUTHORIZED' ? 'text-blue-600' : 'text-amber-600'
            }`}>
              <span>Payment: {order.paymentStatus}</span>
              {order.paymentMethod === 'TAMARA' && (
                <span className="px-1.5 py-0.5 rounded bg-[#FA6651] text-white font-black text-[10px] tracking-tight lowercase inline-flex items-center">
                  tamara &bull; split in 4
                </span>
              )}
              {order.paymentMethod === 'TABBY' && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] tracking-tight lowercase inline-flex items-center">
                  tabby &bull; pay in 4
                </span>
              )}
              {order.paymentMethod === 'IN_STORE' && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] tracking-tight inline-flex items-center">
                  In-Store Payment (5%-10% Off)
                </span>
              )}
              {order.paymentMethod !== 'TAMARA' && order.paymentMethod !== 'TABBY' && order.paymentMethod !== 'IN_STORE' && (
                <span>({order.paymentMethod})</span>
              )}
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
            {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
            <div>{order.shippingAddress.city}, {order.shippingAddress.country}</div>
            <div>Phone: {order.customerPhone || order.shippingAddress.phone}</div>
            <div>Email: {order.customerEmail}</div>
          </div>

          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-1">
              Fulfillment & Dispatch Logistics:
            </div>
            <div>Status: <strong className="text-slate-900">{order.orderStatus}</strong></div>
            <div>Carrier: Insured GCC Express Logistics (Next-Day Priority)</div>
            <div>Tracking Reference: <strong className="font-mono text-slate-900">{(order as any).trackingNumber || 'GCC-NXT-EXPRESS'}</strong></div>
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
                <th className="py-3">Fulfillment</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 pr-2 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="w-9 h-9 object-contain rounded p-0.5 bg-slate-50 border border-slate-200 shrink-0 print:hidden"
                        />
                      )}
                      <span>{item.productName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-slate-500">{item.sku}</td>
                  <td className="py-3.5">
                    <span className="font-semibold text-blue-700">NexTech Enterprise Direct</span>
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
          <div className="w-80 space-y-2 text-xs">
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

            {Boolean(order.inStoreDiscount && order.inStoreDiscount > 0) && (
              <div className="flex items-center justify-between text-emerald-600 font-bold">
                <span>In-Store Payment Discount ({order.inStoreDiscountRate || 5}%):</span>
                <span className="font-mono">-{formatPrice(order.inStoreDiscount || 0)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span>Insured Shipping & Handling:</span>
              <span className="font-mono font-bold">
                {order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>UAE VAT (5% Standard FTA Rate):</span>
              <span className="font-mono font-bold">{formatPrice(order.tax)}</span>
            </div>

            {Boolean(order.paymentSurcharge && order.paymentSurcharge > 0) && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Payment Surcharge ({order.paymentSurchargeRate || (order.paymentMethod === 'TABBY' || order.paymentMethod === 'TAMARA' ? 8 : 3)}%):</span>
                <span className="font-mono font-bold">+{formatPrice(order.paymentSurcharge || 0)}</span>
              </div>
            )}

            {order.paymentMethod === 'COD' && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Cash on Delivery Handling:</span>
                <span className={`font-mono font-bold ${order.codFee && order.codFee > 0 ? 'text-slate-900' : 'text-emerald-600'}`}>
                  {order.codFee && order.codFee > 0 ? `+${formatPrice(order.codFee || 0)}` : 'FREE (Bur Dubai)'}
                </span>
              </div>
            )}

            {order.walletAmountUsed > 0 && (
              <div className="flex items-center justify-between text-blue-600 font-bold">
                <span>Customer Digital Wallet Applied:</span>
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

        {/* Official Stamp & Authorized Signatory Block */}
        <InvoiceStampSignature
          stampUrl={ebill?.stampUrl || ebill?.sellerInfo?.stampUrl}
          signatureUrl={ebill?.signatureUrl || ebill?.sellerInfo?.signatureUrl}
          signatoryName={ebill?.signatoryName || ebill?.sellerInfo?.signatoryName}
          signatoryTitle={ebill?.signatoryTitle || ebill?.sellerInfo?.signatoryTitle}
          showStamp={ebill?.showStamp ?? ebill?.sellerInfo?.showStamp ?? true}
          showSignature={ebill?.showSignature ?? ebill?.sellerInfo?.showSignature ?? true}
          verificationDate={formatDate(order.createdAt)}
          documentRef={order.orderNumber}
          companyTrn="10029384910003"
          className="mt-6"
        />

        {/* Commercial & Statutory Terms and Conditions */}
        <InvoiceTermsAndConditions
          customTerms={ebill?.termsAndConditions}
          className="mt-6"
        />

        {/* Legal Disclaimers & Official Seal */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div>This document is an electronic tax invoice authorized under UAE Federal Decree Law No. 8 of 2017 on VAT.</div>
            <div>All hardware component serial numbers are logged into the NexTech enterprise warranty registry.</div>
          </div>
          <div className="text-right font-mono font-bold text-slate-400">
            DIGITAL SEAL: {order.id.slice(0, 16).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
