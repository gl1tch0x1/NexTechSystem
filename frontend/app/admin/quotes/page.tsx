'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Search,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
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
  Trash2,
  UserPlus,
  Users,
  CreditCard,
  Truck,
  Percent,
  Tag,
  HelpCircle,
  Check,
  Briefcase,
  Receipt,
  RotateCcw,
  Sparkles,
  Package,
} from 'lucide-react';
import { Quote, QuoteStatus, QuoteItem, Product, User } from '@/types';

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

  // Directory state for products & database customers
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [databaseCustomers, setDatabaseCustomers] = useState<User[]>([]);
  const [clientMode, setClientMode] = useState<'DATABASE' | 'MANUAL'>('DATABASE');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

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
    companyName: 'Dubai Future Labs LLC',
    contactName: 'Tariq Mansoor',
    contactEmail: 'tariq.mansoor@dubaifuture.gov.ae',
    contactPhone: '+971 4 516 6666',
    tradeLicense: 'TL-DXB-948210',
    taxRegistrationNumber: '100492817200003',
    clientReference: 'RFP-DFL-2026-AI-09',
    validityDays: 30,
    paymentTerms: 'NET_30' as 'NET_15' | 'NET_30' | 'NET_60' | 'ADVANCE' | 'LC',
    deliverySLA: 'EX_STOCK' as 'EX_STOCK' | '3_5_DAYS' | '2_3_WEEKS' | 'EXPRESS',
    taxTreatment: 'STANDARD' as 'STANDARD' | 'FREE_ZONE' | 'EXPORT' | 'EXEMPT',
    shipping: 0,
    commercialDiscount: 0,
    notes: 'Official corporate quotation. Includes 3-Year Enterprise On-Site Hardware Replacement SLA, free GCC FTA electronic tax invoicing, and certified factory burn-in testing.',
    items: [
      {
        id: 'item-1',
        productId: 'prod_cpu_14900k',
        productName: 'Intel Core i9-14900K 24-Core Desktop Processor',
        sku: 'BX8071514900K',
        quantity: 4,
        unitPrice: 2249,
        discount: 100,
        thumbnail: '/images/intel_i9_14900k.jpg',
      },
      {
        id: 'item-2',
        productId: 'prod_rtx4090',
        productName: 'ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB GDDR6X',
        sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
        quantity: 4,
        unitPrice: 7699,
        discount: 400,
        thumbnail: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
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

    // Load available products for quotation builder
    fetch('/api/products?limit=50')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.products)) {
          setCatalogProducts(data.data.products);
        } else if (Array.isArray(data.data)) {
          setCatalogProducts(data.data);
        }
      })
      .catch(() => {});

    // Load registered database clients
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    fetch('/api/admin/customers', {
      headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDatabaseCustomers(data.data);
        }
      })
      .catch(() => {});
  }, []);

  // Handle clicking outside combobox to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Handle customer selection from database
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = databaseCustomers.find((c) => c.id === customerId);
    if (found) {
      setNewQuoteData((prev) => ({
        ...prev,
        companyName: (found as any).company || (found.name ? `${found.name} Technologies LLC` : 'Enterprise Partner LLC'),
        contactName: found.name,
        contactEmail: found.email,
        contactPhone: (found as any).phone || '+971 4 380 4400',
        tradeLicense: (found as any).tradeLicense || 'TL-DXB-883921',
        taxRegistrationNumber: (found as any).taxRegistrationNumber || '100382910400003',
      }));
    }
  };

  // Add a specific product to quote
  const handleAddProduct = (prod: Product) => {
    if (!prod) return;
    const existingIdx = newQuoteData.items.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      const updated = [...newQuoteData.items];
      updated[existingIdx].quantity += 1;
      setNewQuoteData({ ...newQuoteData, items: updated });
    } else {
      const newItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: 1,
        unitPrice: prod.salePrice || prod.price,
        discount: 0,
        thumbnail: prod.thumbnail || prod.images?.[0] || '',
      };
      setNewQuoteData({ ...newQuoteData, items: [...newQuoteData.items, newItem] });
    }
    showToast(`Added "${prod.name}" to quotation`);
  };

  const getProductCategory = (p: Product): string => {
    if (p.categoryName) return p.categoryName;
    if (typeof p.category === 'string') return p.category;
    if (typeof p.category === 'object' && p.category?.name) return p.category.name;
    return 'Hardware';
  };

  // Extract unique categories for quick-filter tabs in combobox
  const catalogCategories = [
    'ALL',
    ...Array.from(
      new Set(
        catalogProducts
          .map((p) => getProductCategory(p))
          .filter(Boolean)
      )
    ),
  ];

  // Filter catalog products for unified searchable combobox
  const filteredCatalogProducts = catalogProducts.filter((p) => {
    const categoryName = getProductCategory(p);
    const matchesCategory = selectedCategoryFilter === 'ALL' || categoryName === selectedCategoryFilter;
    if (!matchesCategory) return false;

    if (!productSearchQuery.trim()) return true;
    const q = productSearchQuery.toLowerCase().trim();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      (p as any).brandName?.toLowerCase().includes(q) ||
      categoryName.toLowerCase().includes(q)
    );
  });

  const handleSelectFromCombobox = (prod: Product) => {
    handleAddProduct(prod);
    setProductSearchQuery('');
    setIsSearchDropdownOpen(false);
  };

  // Add custom service or non-catalog hardware
  const handleAddCustomLineItem = () => {
    const newItem = {
      id: `item-custom-${Date.now()}`,
      productId: `custom-${Date.now()}`,
      productName: 'Custom Enterprise Hardware / Technical Service',
      sku: 'SRV-CUSTOM-RFP',
      quantity: 1,
      unitPrice: 1500,
      discount: 0,
      thumbnail: '',
    };
    setNewQuoteData({ ...newQuoteData, items: [...newQuoteData.items, newItem] });
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...newQuoteData.items];
    updated[index].quantity = newQty;
    setNewQuoteData({ ...newQuoteData, items: updated });
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updated = [...newQuoteData.items];
    updated[index].unitPrice = Math.max(0, newPrice);
    setNewQuoteData({ ...newQuoteData, items: updated });
  };

  const handleUpdateItemDiscount = (index: number, newDiscount: number) => {
    const updated = [...newQuoteData.items];
    updated[index].discount = Math.max(0, newDiscount);
    setNewQuoteData({ ...newQuoteData, items: updated });
  };

  const handleUpdateItemName = (index: number, name: string) => {
    const updated = [...newQuoteData.items];
    updated[index].productName = name;
    setNewQuoteData({ ...newQuoteData, items: updated });
  };

  const handleUpdateItemSku = (index: number, sku: string) => {
    const updated = [...newQuoteData.items];
    updated[index].sku = sku;
    setNewQuoteData({ ...newQuoteData, items: updated });
  };

  const handleRemoveItem = (index: number) => {
    const updated = newQuoteData.items.filter((_, i) => i !== index);
    setNewQuoteData({ ...newQuoteData, items: updated });
  };

  // Real-time financial calculations
  const quoteItemsSubtotal = newQuoteData.items.reduce(
    (sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 1)),
    0
  );
  const quoteItemsDiscount = newQuoteData.items.reduce(
    (sum, it) => sum + (Number(it.discount || 0) * Number(it.quantity || 1)),
    0
  );
  const quoteCommercialDiscount = Number(newQuoteData.commercialDiscount || 0);
  const quoteTotalDiscount = quoteItemsDiscount + quoteCommercialDiscount;
  const quoteNetTaxable = Math.max(0, quoteItemsSubtotal - quoteTotalDiscount);

  const isZeroTax =
    newQuoteData.taxTreatment === 'FREE_ZONE' ||
    newQuoteData.taxTreatment === 'EXPORT' ||
    newQuoteData.taxTreatment === 'EXEMPT';
  const quoteTax = isZeroTax ? 0 : Math.round(quoteNetTaxable * 0.05 * 100) / 100;
  const quoteShipping = Number(newQuoteData.shipping || 0);
  const quoteGrandTotal = quoteNetTaxable + quoteTax + quoteShipping;

  const computeExpiryDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 30));
    return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteData.companyName.trim()) {
      alert('Please enter the Company / Organization Name.');
      return;
    }
    if (!newQuoteData.contactEmail.trim()) {
      alert('Please enter a valid Contact Email.');
      return;
    }
    if (newQuoteData.items.length === 0) {
      alert('Please add at least one line item to the quotation.');
      return;
    }

    setSubmittingQuote(true);
    try {
      const payload = {
        companyName: newQuoteData.companyName.trim(),
        contactName: newQuoteData.contactName.trim() || 'Procurement Officer',
        contactEmail: newQuoteData.contactEmail.trim(),
        contactPhone: newQuoteData.contactPhone.trim(),
        tradeLicense: newQuoteData.tradeLicense.trim(),
        taxRegistrationNumber: newQuoteData.taxRegistrationNumber.trim(),
        clientReference: newQuoteData.clientReference.trim(),
        validityDays: Number(newQuoteData.validityDays),
        paymentTerms: newQuoteData.paymentTerms,
        deliverySLA: newQuoteData.deliverySLA,
        taxTreatment: newQuoteData.taxTreatment,
        shipping: quoteShipping,
        discount: quoteTotalDiscount,
        subtotal: quoteItemsSubtotal,
        tax: quoteTax,
        total: quoteGrandTotal,
        notes: newQuoteData.notes,
        items: newQuoteData.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount,
          subtotal: it.unitPrice * it.quantity - it.discount * it.quantity,
        })),
      };

      const res = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (data.success) {
        showToast(`🎉 Quotation ${data.data?.quoteNumber || 'QTE-NEW'} drafted successfully!`);
        setIsNewQuoteModalOpen(false);
        fetchQuotes();
      } else {
        alert(data.error?.message || 'Failed to submit quote.');
      }
    } catch (err) {
      console.error('Failed to create quote:', err);
      alert('Network error while creating corporate quotation.');
    } finally {
      setSubmittingQuote(false);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Corporate Contact</div>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedQuote.contactName}</div>
                  <div className="text-slate-500">{selectedQuote.contactEmail}</div>
                  <div className="text-slate-500">{selectedQuote.contactPhone || 'No phone'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Tax Registration &amp; License</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedQuote.taxRegistrationNumber || 'Exempt / None'}
                  </div>
                  <div className="text-slate-500">License: {selectedQuote.tradeLicense || 'Direct Corporate'}</div>
                  <div className="text-purple-600 dark:text-purple-400 font-semibold">{selectedQuote.taxTreatment || 'UAE FTA Standard 5%'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Commercial Terms &amp; SLA</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {selectedQuote.paymentTerms || 'Net-30 Corporate Terms'}
                  </div>
                  <div className="text-slate-500">SLA: {selectedQuote.deliverySLA || 'Ex-Stock (24-48h)'}</div>
                  {selectedQuote.clientReference && (
                    <div className="text-slate-500 font-mono text-[10px]">Ref: {selectedQuote.clientReference}</div>
                  )}
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Quote Validity</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Until {new Date(selectedQuote.validUntil).toLocaleDateString()}
                  </div>
                  <div className="text-slate-500">Status: {selectedQuote.status}</div>
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

      {/* New Corporate Quotation Draft Engine Modal */}
      {isNewQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/5 via-transparent to-transparent shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold shadow-inner">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      Draft New Corporate Quotation
                    </h3>
                    <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                      Enterprise RFP Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    B2B enterprise proposals, custom hardware matrices, dynamic GCC/FTA VAT compliance &amp; payment SLAs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewQuoteModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateQuote} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* SECTION 1: CLIENT SELECTION & PROFILE */}
              <div className="space-y-3.5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      1. Corporate Client &amp; Consignee Details
                    </span>
                  </div>

                  {/* Segmented Dual Mode Toggle */}
                  <div className="grid grid-cols-2 sm:inline-flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setClientMode('DATABASE')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                        clientMode === 'DATABASE'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Pick Database Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientMode('MANUAL')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                        clientMode === 'MANUAL'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Add New Client Manually</span>
                    </button>
                  </div>
                </div>

                {clientMode === 'DATABASE' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Select Registered Corporate Client / Organization
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800/60 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="">-- Choose Existing Client from Database --</option>
                      {databaseCustomers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.company ? `${cust.company} (${cust.name})` : cust.name} • {cust.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Form Fields for Client Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Trade License Number
                    </label>
                    <input
                      type="text"
                      value={newQuoteData.tradeLicense}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, tradeLicense: e.target.value })}
                      placeholder="e.g. TL-DXB-948210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Tax Registration (TRN)
                    </label>
                    <input
                      type="text"
                      value={newQuoteData.taxRegistrationNumber}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, taxRegistrationNumber: e.target.value })}
                      placeholder="100492817200003"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Contact Person &amp; Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newQuoteData.contactName}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, contactName: e.target.value })}
                      placeholder="e.g. Tariq Mansoor (Procurement)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
                      placeholder="tariq.mansoor@company.ae"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Contact Phone &amp; Extension
                    </label>
                    <input
                      type="text"
                      value={newQuoteData.contactPhone}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, contactPhone: e.target.value })}
                      placeholder="+971 4 516 6666"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Client RFP / Tender / PO Reference
                  </label>
                  <input
                    type="text"
                    value={newQuoteData.clientReference}
                    onChange={(e) => setNewQuoteData({ ...newQuoteData, clientReference: e.target.value })}
                    placeholder="e.g. RFP-DFL-2026-AI-09 / TENDER-GOV-442"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 2: COMMERCIAL TERMS, VALIDITY & TAX COMPLIANCE */}
              <div className="space-y-3.5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    2. Commercial SLA &amp; Tax Compliance Framework
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Validity Period */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Quote Validity
                      </label>
                      <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                        Exp: {computeExpiryDate(newQuoteData.validityDays)}
                      </span>
                    </div>
                    <select
                      value={newQuoteData.validityDays}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, validityDays: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value={7}>7 Days (Fast-Track RFP)</option>
                      <option value={14}>14 Days (Standard Two Weeks)</option>
                      <option value={30}>30 Days (Corporate Standard)</option>
                      <option value={60}>60 Days (Enterprise Tender)</option>
                      <option value={90}>90 Days (Government Tender)</option>
                    </select>
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Payment Terms
                    </label>
                    <select
                      value={newQuoteData.paymentTerms}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, paymentTerms: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="NET_30">Net 30 Days (Corporate Standard)</option>
                      <option value="NET_15">Net 15 Days</option>
                      <option value="NET_60">Net 60 Days (Enterprise Approved)</option>
                      <option value="ADVANCE">100% Advance Payment</option>
                      <option value="LC">Letter of Credit (L/C at Sight)</option>
                    </select>
                  </div>

                  {/* Delivery SLA */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      Delivery &amp; Logistics SLA
                    </label>
                    <select
                      value={newQuoteData.deliverySLA}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, deliverySLA: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="EX_STOCK">Immediate Ex-Stock (24-48 Hours)</option>
                      <option value="3_5_DAYS">Standard Delivery (3-5 Business Days)</option>
                      <option value="EXPRESS">Priority Express (Next-Day Air Courier)</option>
                      <option value="2_3_WEEKS">OEM Direct Import (2-3 Weeks)</option>
                    </select>
                  </div>

                  {/* Tax Treatment */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                      VAT / Tax Treatment
                    </label>
                    <select
                      value={newQuoteData.taxTreatment}
                      onChange={(e) => setNewQuoteData({ ...newQuoteData, taxTreatment: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="STANDARD">UAE FTA Standard (5% VAT)</option>
                      <option value="FREE_ZONE">Designated Free Zone (0% VAT)</option>
                      <option value="EXPORT">International Export (0% VAT)</option>
                      <option value="EXEMPT">Official Tax Exempt (0% VAT)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: HARDWARE LINE ITEMS & TECHNICAL SERVICES */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                          3. Hardware Matrix &amp; Line Items
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200 dark:border-purple-800/60">
                          {newQuoteData.items.length} {newQuoteData.items.length === 1 ? 'Item' : 'Items'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pick components from the unified catalog below or append custom RFP service deliverables.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomLineItem}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>+ Custom Line Item</span>
                  </button>
                </div>

                {/* UNIFIED SEARCHABLE COMBOBOX */}
                <div ref={comboboxRef} className="relative z-20">
                  <div
                    className={`relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-sm ${
                      isSearchDropdownOpen
                        ? 'border-purple-500 ring-2 ring-purple-500/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="pl-4 pr-2 text-slate-400 flex items-center justify-center">
                      <Search className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setIsSearchDropdownOpen(true);
                      }}
                      onFocus={() => setIsSearchDropdownOpen(true)}
                      placeholder="Select hardware from catalog dropdown or type to search (e.g. RTX 4090, i9-14900K, DDR5, Corsair)..."
                      className="w-full py-3 pr-2 text-xs font-medium text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <div className="flex items-center gap-1.5 pr-3 shrink-0">
                      {productSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setProductSearchQuery('')}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                        title="Toggle Catalog Dropdown"
                      >
                        <span>Catalog ({catalogProducts.length})</span>
                        {isSearchDropdownOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Floating Unified Dropdown Menu */}
                  {isSearchDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-30 animate-fadeIn">
                      {/* Category Pills Quick Filter Bar */}
                      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
                          {catalogCategories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedCategoryFilter(cat)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                selectedCategoryFilter === cat
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap pl-2 shrink-0">
                          {filteredCatalogProducts.length} matching
                        </span>
                      </div>

                      {/* Products Scrollable List */}
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredCatalogProducts.length === 0 ? (
                          <div className="p-6 text-center">
                            <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              No catalog components found matching &quot;{productSearchQuery}&quot;
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Try another search keyword or create a custom service deliverable.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddCustomLineItem();
                                setIsSearchDropdownOpen(false);
                              }}
                              className="mt-3 px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors cursor-pointer"
                            >
                              + Create Custom Line Item
                            </button>
                          </div>
                        ) : (
                          filteredCatalogProducts.map((prod) => (
                            <div
                              key={prod.id}
                              onClick={() => handleSelectFromCombobox(prod)}
                              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {prod.thumbnail || prod.images?.[0] ? (
                                  <img
                                    src={prod.thumbnail || prod.images?.[0]}
                                    alt={prod.name}
                                    className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-xs">
                                    {prod.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                                      SKU: {prod.sku}
                                    </span>
                                    {prod.categoryName && (
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans text-[9px] font-bold">
                                        {prod.categoryName}
                                      </span>
                                    )}
                                    {prod.brandName && (
                                      <span className="text-slate-400 font-sans">
                                        • {prod.brandName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <div className="font-black text-slate-900 dark:text-white text-xs">
                                    AED {(prod.salePrice || prod.price).toLocaleString()}
                                  </div>
                                  {prod.compareAtPrice && prod.compareAtPrice > (prod.salePrice || prod.price) && (
                                    <div className="text-[10px] line-through text-slate-400">
                                      AED {prod.compareAtPrice.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectFromCombobox(prod);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Line Items Table */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Component / Service Deliverable</th>
                          <th className="px-4 py-3 w-28 text-center">Qty</th>
                          <th className="px-4 py-3 w-36">Unit Price (AED)</th>
                          <th className="px-4 py-3 w-32">Discount (AED)</th>
                          <th className="px-4 py-3 text-right w-36">Net Line Total</th>
                          <th className="px-3 py-3 text-center w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {newQuoteData.items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                              <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                No items in quotation matrix
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Use the catalog combobox above or click &quot;+ Custom Line Item&quot;.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          newQuoteData.items.map((item, idx) => {
                            const lineTotal = Math.max(
                              0,
                              item.unitPrice * item.quantity - item.discount * item.quantity
                            );
                            return (
                              <tr
                                key={item.id || idx}
                                className="hover:bg-purple-50/20 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3">
                                    {item.thumbnail ? (
                                      <img
                                        src={item.thumbnail}
                                        alt={item.productName}
                                        className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800/40">
                                        <Package className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <input
                                        type="text"
                                        value={item.productName}
                                        onChange={(e) => handleUpdateItemName(idx, e.target.value)}
                                        className="w-full px-2 py-1 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:outline-none transition-all"
                                        placeholder="Component or Service Name"
                                      />
                                      <input
                                        type="text"
                                        value={item.sku}
                                        onChange={(e) => handleUpdateItemSku(idx, e.target.value)}
                                        className="w-full px-2 py-0.5 rounded-lg bg-transparent text-[10px] font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-purple-500 focus:outline-none transition-all"
                                        placeholder="SKU Reference"
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-0.5 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-30 cursor-pointer"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleUpdateItemQuantity(idx, parseInt(e.target.value, 10) || 1)
                                      }
                                      className="w-9 text-center bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2.5 text-[10px] font-bold text-slate-400 select-none">
                                      AED
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unitPrice}
                                      onChange={(e) =>
                                        handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)
                                      }
                                      className="w-full pl-10 pr-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2.5 text-[11px] font-bold text-emerald-500 select-none">
                                      -
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.discount}
                                      onChange={(e) =>
                                        handleUpdateItemDiscount(idx, parseFloat(e.target.value) || 0)
                                      }
                                      className="w-full pl-6 pr-2.5 py-1.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="font-black text-slate-900 dark:text-white text-xs">
                                    AED {lineTotal.toLocaleString()}
                                  </div>
                                  {item.discount > 0 && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      Saved AED {(item.discount * item.quantity).toLocaleString()}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/50 transition-all cursor-pointer"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SECTION 4: FREIGHT, COMMERCIAL DISCOUNTS & SCOPE OF WORK */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                    <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Freight &amp; Commercial Contract Discounts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Logistics / Freight (AED)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newQuoteData.shipping}
                        onChange={(e) => setNewQuoteData({ ...newQuoteData, shipping: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Global Contract Discount (AED)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newQuoteData.commercialDiscount}
                        onChange={(e) =>
                          setNewQuoteData({ ...newQuoteData, commercialDiscount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Commercial Scope, SLA &amp; Notes
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={newQuoteData.notes}
                    onChange={(e) => setNewQuoteData({ ...newQuoteData, notes: e.target.value })}
                    placeholder="Provide quotation notes, warranty clauses, deployment scope, and OEM validation guarantees..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-xs"
                  />
                </div>
              </div>

              {/* SECTION 5: REAL-TIME FINANCIAL SUMMARY CARD */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-slate-50 dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-950 border border-purple-200 dark:border-purple-800/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Enterprise Financial Computation</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tax Treatment: <strong className="text-slate-800 dark:text-slate-200">{newQuoteData.taxTreatment}</strong> • Terms:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{newQuoteData.paymentTerms}</strong>
                  </div>
                </div>

                <div className="w-full sm:w-80 space-y-1.5 text-xs bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between text-slate-500">
                    <span>Hardware Subtotal:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      AED {quoteItemsSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {quoteTotalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Total Contract Discount:</span>
                      <span>- AED {quoteTotalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Net Taxable Base:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      AED {quoteNetTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>VAT ({isZeroTax ? '0% Zero-Rated' : '5% Standard'}):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      AED {quoteTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {quoteShipping > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Logistics / Freight:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        AED {quoteShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    <span>Quotation Grand Total:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono">
                      AED {quoteGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewQuoteModalOpen(false)}
                  disabled={submittingQuote}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="flex-2 sm:flex-none px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer text-center"
                >
                  {submittingQuote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Generating Quotation...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0" />
                      <span>Generate &amp; Submit Corporate Quotation</span>
                    </>
                  )}
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
