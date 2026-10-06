'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCurrency } from '@/lib/currency-context';
import { ApiClient } from '@/lib/api-client';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileText,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Copy,
  Check
} from 'lucide-react';

interface PaymentStatusDetails {
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  total?: number;
  currency?: string;
  paymentReference?: string;
  paymentMetadata?: {
    isSimulated?: boolean;
    provider?: string;
    [key: string]: any;
  };
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { formatPrice } = useCurrency();

  const orderId = searchParams.get('orderId') || '';
  const statusParam = searchParams.get('status') || '';
  const provider = (searchParams.get('provider') || 'TAMARA').toUpperCase();
  const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId') || '';
  const isSimulatedParam = searchParams.get('simulated') === 'true';

  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<PaymentStatusDetails | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      setIsSuccess(false);
      setErrorMessage('No order reference was provided in the return callback URL.');
      return;
    }

    let isMounted = true;

    async function verifyAndFetchStatus() {
      try {
        setIsLoading(true);

        // 1. Verify with backend
        try {
          const verifyRes = await ApiClient.post<{
            success: boolean;
            data: PaymentStatusDetails;
          }>('/payments/verify', {
            orderId,
            status: statusParam,
            paymentId,
            isSimulated: isSimulatedParam,
          }, { token: token || undefined });

          if (isMounted && verifyRes.data) {
            setOrderDetails(verifyRes.data);
            setIsSuccess(verifyRes.data.paymentStatus === 'PAID');
          }
        } catch {
          // If verify had an issue or user refreshed, fetch status directly
          const statusRes = await ApiClient.get<{
            success: boolean;
            data: PaymentStatusDetails;
          }>(`/payments/status/${orderId}`, { token: token || undefined });

          if (isMounted && statusRes.data) {
            setOrderDetails(statusRes.data);
            const approved =
              statusRes.data.paymentStatus === 'PAID' ||
              statusParam === 'success' ||
              statusParam === 'approved' ||
              isSimulatedParam;
            setIsSuccess(approved);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Payment verification failed:', err);
          // If statusParam indicates success (e.g. redirected directly from gateway)
          const fallbackApproved =
            statusParam === 'success' ||
            statusParam === 'approved' ||
            isSimulatedParam;
          setIsSuccess(fallbackApproved);
          setErrorMessage(err.message || 'Unable to confirm live settlement status.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyAndFetchStatus();

    return () => {
      isMounted = false;
    };
  }, [orderId, statusParam, paymentId, isSimulatedParam, token]);

  const copyOrderNumber = () => {
    const textToCopy = orderDetails?.orderNumber || orderId;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isTamara = provider === 'TAMARA';
  const providerName = isTamara ? 'Tamara' : 'Tabby';
  const providerColor = isTamara ? 'text-[#FA6651]' : 'text-emerald-500';
  const providerBadgeBg = isTamara ? 'bg-[#FA6651]' : 'bg-emerald-600';
  const totalAmount = orderDetails?.total || 0;
  const installmentAmount = totalAmount > 0 ? totalAmount / 4 : 0;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-tech-blue animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-black tracking-tight ${providerColor}`}>
              {providerName.toLowerCase()}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Verifying Buy Now Pay Later Settlement
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          Communicating with {providerName} and synchronizing installment schedule. Please do not close this window...
        </p>
      </div>
    );
  }

  // Payment Declined / Cancelled state
  if (isSuccess === false) {
    return (
      <div className="min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col items-center justify-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/50 p-6 sm:p-10 shadow-xl shadow-rose-500/5 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />

          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-500 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 mb-3">
            Payment Not Completed
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {providerName} Authorization Incomplete
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 max-w-lg mx-auto">
            {errorMessage ||
              `The installment application on ${providerName} was cancelled or declined. No amount has been deducted from your card.`}
          </p>

          {orderId && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-left max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Order Reference</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {orderDetails?.orderNumber || orderId}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Payment Status</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">Pending Authorization</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/checkout"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry with Card / COD</span>
            </Link>

            {orderId && (
              <Link
                href={`/account/orders/${orderId}`}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <span>View Order Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Payment Authorized & Confirmed State
  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col items-center justify-center">
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top colored accent line */}
        <div className={`absolute top-0 inset-x-0 h-2 ${providerBadgeBg}`} />

        {/* Sandbox indicator banner */}
        {(isSimulatedParam || orderDetails?.paymentMetadata?.isSimulated) && (
          <div className="mb-6 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Developer Sandbox: Instant payment simulation verified successfully</span>
          </div>
        )}

        {/* Success Icon & Provider Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-500 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div
              className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg ${providerBadgeBg} text-white font-black text-[10px] tracking-tight uppercase shadow-xs`}
            >
              {providerName}
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Payment Authorized
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Order Confirmed & Split in 4
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg">
            Your payment plan with <strong className="text-slate-900 dark:text-white">{providerName}</strong> has been
            approved. Your items are being prepared for rapid courier dispatch.
          </p>

          {/* Order Reference Box */}
          <div className="mt-5 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">Order Number:</span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
              {orderDetails?.orderNumber || orderId}
            </span>
            <button
              onClick={copyOrderNumber}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Copy Order Number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 4 Installments Schedule Breakdown */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-tech-blue" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Installment Schedule (0% Interest)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {totalAmount > 0 ? formatPrice(totalAmount) : 'Total AED'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-2xs relative">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Today (Paid)
              </span>
              <p className="font-mono font-black text-sm text-slate-900 dark:text-white mt-1">
                {installmentAmount > 0 ? formatPrice(installmentAmount) : '25%'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Authorized</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                In 1 Month
              </span>
              <p className="font-mono font-black text-sm text-slate-900 dark:text-white mt-1">
                {installmentAmount > 0 ? formatPrice(installmentAmount) : '25%'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Automated</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                In 2 Months
              </span>
              <p className="font-mono font-black text-sm text-slate-900 dark:text-white mt-1">
                {installmentAmount > 0 ? formatPrice(installmentAmount) : '25%'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Automated</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                In 3 Months
              </span>
              <p className="font-mono font-black text-sm text-slate-900 dark:text-white mt-1">
                {installmentAmount > 0 ? formatPrice(installmentAmount) : '25%'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Final</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2">
            <span>Provider: {providerName} Payment Gateway</span>
            <span>No hidden interest &bull; Sharia compliant</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/account/orders/${orderId}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-tech-blue hover:bg-tech-blue/90 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-tech-blue/20 flex items-center justify-center gap-2"
          >
            <span>View Order & Tracking</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={`/account/orders/${orderId}?tab=ebill`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>UAE FTA Tax Invoice / E-Bill</span>
          </Link>

          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-tech-blue" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
