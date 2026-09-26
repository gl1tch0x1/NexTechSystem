'use client';

import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import DigitalEBillModal from '@/components/invoice/DigitalEBillModal';
import {
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  Search,
  X,
  MapPin,
  CreditCard,
  Eye,
  Sparkles,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  PackageCheck,
  Loader2,
  Layers,
  ChevronDown,
  XCircle,
  User,
  Briefcase,
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface OrderItemDraft {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  stock: number;
  thumbnail?: string;
  quantity: number;
}

const getNormalizedStatus = (order: Order | any): OrderStatus => {
  const raw = (order?.orderStatus || order?.status || 'PENDING').toString().toUpperCase();
  if (raw === 'CONFIRMED' || raw === 'PROCESSING') return 'PROCESSING';
  if (raw === 'SHIPPED') return 'SHIPPED';
  if (raw === 'DELIVERED') return 'DELIVERED';
  if (raw === 'CANCELLED' || raw === 'REFUNDED' || raw === 'RETURNED') return 'CANCELLED';
  return 'PENDING';
};

const getStatusBadgeConfig = (status: OrderStatus | string) => {
  const norm = (status || 'PENDING').toString().toUpperCase();
  switch (norm) {
    case 'DELIVERED':
      return {
        label: 'Delivered',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dotClass: 'bg-emerald-500',
        itemsStatus: 'Items Delivered',
        icon: CheckCircle2,
      };
    case 'SHIPPED':
      return {
        label: 'Shipped',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        dotClass: 'bg-blue-500',
        itemsStatus: 'Items In Transit',
        icon: Truck,
      };
    case 'PROCESSING':
    case 'CONFIRMED':
      return {
        label: 'Processing',
        badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        dotClass: 'bg-purple-500',
        itemsStatus: 'Items In Processing',
        icon: PackageCheck,
      };
    case 'CANCELLED':
    case 'REFUNDED':
    case 'RETURNED':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        dotClass: 'bg-rose-500',
        itemsStatus: 'Items Cancelled',
        icon: XCircle,
      };
    case 'PENDING':
    default:
      return {
        label: 'Pending',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        dotClass: 'bg-amber-500',
        itemsStatus: 'Items Pending Dispatch',
        icon: Clock,
      };
  }
};

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Inspection modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Digital E-Bill modal state
  const [eBillOrder, setEBillOrder] = useState<Order | null>(null);

  // Serial Number Modal State
  const [serialModal, setSerialModal] = useState<{
    itemIdx: number;
    productName: string;
    serialNumbers: string;
    quantity: number;
  } | null>(null);
  const [savingSerial, setSavingSerial] = useState(false);

  // Order Toast Feedback
  const [orderToast, setOrderToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showOrderToast = (type: 'success' | 'error', message: string) => {
    setOrderToast({ type, message });
    setTimeout(() => setOrderToast(null), 4000);
  };

  const handleOpenSerialModal = (itemIdx: number) => {
    if (!selectedOrder) return;
    const currentItem = selectedOrder.items[itemIdx];
    setSerialModal({
      itemIdx,
      productName: currentItem.productName,
      serialNumbers: (currentItem.serialNumbers || []).join(', '),
      quantity: currentItem.quantity || 1,
    });
  };

  const handleSaveSerialNumbers = async () => {
    if (!selectedOrder || !token || !serialModal) return;
    try {
      setSavingSerial(true);
      const newSns = serialModal.serialNumbers.split(/[\n,]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
      const updatedItems = [...selectedOrder.items];
      updatedItems[serialModal.itemIdx] = {
        ...updatedItems[serialModal.itemIdx],
        serialNumbers: newSns,
      };
      setSelectedOrder({ ...selectedOrder, items: updatedItems });
      await ApiClient.put(`/admin/orders/${selectedOrder.id}/status`, {
        status: selectedOrder.orderStatus || selectedOrder.status,
        items: updatedItems,
        note: `Hardware Serial Numbers updated for line item #${serialModal.itemIdx + 1}`,
      }, { token });
      showOrderToast('success', `Assigned ${newSns.length} serial number(s) to line item.`);
      setSerialModal(null);
      fetchOrders();
    } catch (err: any) {
      console.error('Failed to save serial number:', err);
      showOrderToast('error', 'Failed to save serial number: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingSerial(false);
    }
  };

  // Create Sales Order modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Form Fields & Modes
  const [clientSelectionMode, setClientSelectionMode] = useState<'DATABASE' | 'MANUAL'>('DATABASE');
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');

  // Customer Contact Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Business / Seller B2B Fields
  const [companyName, setCompanyName] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [trn, setTrn] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactRole, setContactRole] = useState('Procurement Lead');
  const [poNumber, setPoNumber] = useState('');
  const [partnerTier, setPartnerTier] = useState('CERTIFIED_PARTNER');
  const [paymentTerms, setPaymentTerms] = useState('NET_30');
  const [taxTreatment, setTaxTreatment] = useState<'STANDARD' | 'FREE_ZONE' | 'EXPORT' | 'EXEMPT'>('STANDARD');

  // Shipping Address
  const [addressLine1, setAddressLine1] = useState('Business Bay, Tower 4, Suite 1200');
  const [city, setCity] = useState('Dubai');
  const [stateRegion, setStateRegion] = useState('Dubai');
  const [country, setCountry] = useState('AE');
  const [postalCode, setPostalCode] = useState('00000');

  // Billing Address
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddressLine1, setBillingAddressLine1] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingCountry, setBillingCountry] = useState('AE');
  const [billingPostalCode, setBillingPostalCode] = useState('');

  // Line items
  const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productComboboxRef = useRef<HTMLDivElement>(null);

  // Close product combobox on outside click or Escape key
  useEffect(() => {
    if (!isProductDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (productComboboxRef.current && !productComboboxRef.current.contains(e.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProductDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProductDropdownOpen]);

  // Real-time filtered suggestions based on typing
  const filteredProducts = availableProducts.filter(p => {
    if (!productSearchQuery.trim()) return true;
    const q = productSearchQuery.toLowerCase().trim();
    const name = (p.name || p.title || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    return name.includes(q) || sku.includes(q) || category.includes(q) || brand.includes(q);
  });

  // Payment & status options
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'BANK_TRANSFER' | 'COD' | 'WALLET'>('CREDIT_CARD');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('PROCESSING');
  const [orderNotes, setOrderNotes] = useState('Admin Direct Sales Order');

  const fetchOrders = () => {
    if (token) {
      ApiClient.get<Order[]>('/admin/orders', { token })
        .then(res => setOrders(res || []))
        .catch(err => console.error(err))
;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateError('');
    setCreateSuccess('');
    
    setProductSearchQuery('');
    setIsProductDropdownOpen(false);

    try {
      const [prodsRes, custsRes] = await Promise.all([
        ApiClient.get<any>('/products?limit=100'),
        token ? ApiClient.get<any>('/admin/customers', { token }).catch(() => []) : Promise.resolve([] as any[]),
      ]);

      const prodsList = Array.isArray(prodsRes) ? prodsRes : (prodsRes?.products || prodsRes?.data || []);
      const custList = Array.isArray(custsRes) ? custsRes : ((custsRes as any)?.data || []);

      setAvailableProducts(prodsList);
      setAvailableCustomers(custList);

      if (prodsList.length > 0 && !selectedProductIdToAdd) {
        setSelectedProductIdToAdd(prodsList[0].id);
      }

      // Default to first customer if available and in database mode
      if (clientSelectionMode === 'DATABASE' && custList.length > 0 && !selectedCustomerId) {
        const firstCust = custList[0];
        handleSelectCustomer(firstCust.id, custList);
      }
    } catch (err: any) {
      console.error('Failed to load modal data:', err);
    } finally {
      
    }
  };

  const handleSelectCustomer = (custId: string, customList?: any[]) => {
    setSelectedCustomerId(custId);
    const list = customList || availableCustomers;
    if (!custId) {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCompanyName('');
      setTradeLicense('');
      setTrn('');
      setContactPerson('');
      return;
    }
    const customer = list.find(c => c.id === custId);
    if (customer) {
      const isBusiness =
        customer.role === 'RESELLER' ||
        !!customer.companyName ||
        customer.customerType === 'BUSINESS';

      if (isBusiness) {
        setCustomerType('BUSINESS');
        setCompanyName(customer.companyName || customer.organization || customer.name || 'Commercial Partner LLC');
        setContactPerson(customer.name || customer.fullName || 'Authorized Agent');
        setContactRole(customer.role === 'RESELLER' ? 'Authorized Reseller Partner' : 'Commercial Procurement Lead');
        setTradeLicense(customer.tradeLicense || customer.crn || 'CN-904128-DXB');
        setTrn(customer.trn || customer.taxNumber || '100293848200003');
        if (customer.partnerTier) setPartnerTier(customer.partnerTier);
      } else {
        setCustomerType('INDIVIDUAL');
      }

      setCustomerName(customer.name || customer.fullName || '');
      setCustomerEmail(customer.email || '');
      setCustomerPhone(customer.phone || '+971 4 800 TECH');
      if (customer.addresses && customer.addresses.length > 0) {
        const addr = customer.addresses.find((a: any) => a.isDefaultShipping) || customer.addresses[0];
        setAddressLine1(addr.addressLine1 || addressLine1);
        setCity(addr.city || city);
        setStateRegion(addr.state || stateRegion);
        setCountry(addr.country || country);
        setPostalCode(addr.postalCode || postalCode);
      }
    }
  };

  const handleClearCustomerForm = () => {
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCompanyName('');
    setTradeLicense('');
    setTrn('');
    setContactPerson('');
    setContactRole('Procurement Lead');
    setPoNumber('');
    setAddressLine1('');
    setCity('Dubai');
    setStateRegion('Dubai');
    setCountry('AE');
    setPostalCode('');
    setBillingAddressLine1('');
    setBillingCity('');
    setBillingPostalCode('');
  };

  const handleSelectProduct = (prod: any) => {
    setSelectedProductIdToAdd(prod.id);
    setProductSearchQuery(prod.name || prod.title || '');
    setIsProductDropdownOpen(false);
  };

  const handleAddProduct = (prodOverride?: any) => {
    const prod =
      prodOverride ||
      availableProducts.find(p => p.id === selectedProductIdToAdd) ||
      (filteredProducts.length > 0 ? filteredProducts[0] : null);

    if (!prod) return;

    const existingIdx = orderItems.findIndex(i => i.productId === prod.id);
    if (existingIdx > -1) {
      const updated = [...orderItems];
      if (updated[existingIdx].quantity < (prod.stock || 99)) {
        updated[existingIdx].quantity += 1;
        setOrderItems(updated);
      }
    } else {
      setOrderItems([
        ...orderItems,
        {
          productId: prod.id,
          productName: prod.name || prod.title,
          sku: prod.sku || 'SKU-GEN',
          price: prod.price || 0,
          stock: prod.stock || 10,
          thumbnail: prod.thumbnail || prod.primaryImage || (prod.images && prod.images[0]),
          quantity: 1,
        }
      ]);
    }

    // Reset query for seamless subsequent additions
    setSelectedProductIdToAdd('');
    setProductSearchQuery('');
    setIsProductDropdownOpen(false);
  };

  const handleUpdateQuantity = (productId: string, qty: number) => {
    setOrderItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const safeQty = Math.max(1, Math.min(item.stock || 999, qty));
          return { ...item, quantity: safeQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(prev => prev.filter(i => i.productId !== productId));
  };

  const itemsSubtotal = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const isZeroRatedTax = taxTreatment === 'FREE_ZONE' || taxTreatment === 'EXPORT' || taxTreatment === 'EXEMPT';
  const vatTax = isZeroRatedTax ? 0 : itemsSubtotal * 0.05;
  const shippingFee = itemsSubtotal > 5000 || itemsSubtotal === 0 ? 0 : 50;
  const orderGrandTotal = itemsSubtotal + vatTax + shippingFee;

  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (orderItems.length === 0) {
      setCreateError('Please add at least one hardware product line item to the sales order.');
      return;
    }

    if (customerType === 'BUSINESS') {
      if (!companyName.trim()) {
        setCreateError('Company Legal / Trading Name is required for Business Seller sales orders.');
        return;
      }
      if (!customerEmail.trim()) {
        setCreateError('Corporate email address is required.');
        return;
      }
      if (!contactPerson.trim() && !customerName.trim()) {
        setCreateError('Authorized contact person or representative name is required.');
        return;
      }
    } else {
      if (!customerName.trim() || !customerEmail.trim()) {
        setCreateError('Customer full name and email address are required.');
        return;
      }
    }

    setCreatingOrder(true);
    setCreateError('');

    try {
      const resolvedContactName = customerType === 'BUSINESS'
        ? (contactPerson.trim() || customerName.trim())
        : customerName.trim();

      const shippingAddr = {
        id: `addr_${Date.now()}`,
        fullName: resolvedContactName,
        phone: customerPhone.trim() || '+971 4 800 TECH',
        addressLine1: addressLine1.trim() || 'Sheikh Zayed Road, Commercial District',
        city: city.trim() || 'Dubai',
        state: stateRegion.trim() || 'Dubai',
        country: country.trim() || 'AE',
        postalCode: postalCode.trim() || '00000',
      };

      const billingAddr = sameAsShipping ? shippingAddr : {
        id: `addr_bill_${Date.now()}`,
        fullName: customerType === 'BUSINESS' ? (companyName.trim() || resolvedContactName) : resolvedContactName,
        phone: customerPhone.trim() || '+971 4 800 TECH',
        addressLine1: billingAddressLine1.trim() || addressLine1.trim(),
        city: billingCity.trim() || city.trim(),
        state: stateRegion.trim(),
        country: billingCountry.trim() || country.trim(),
        postalCode: billingPostalCode.trim() || postalCode.trim(),
      };

      const payload = {
        customerId: clientSelectionMode === 'DATABASE' && selectedCustomerId ? selectedCustomerId : undefined,
        customerName: resolvedContactName,
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || '+971 4 800 TECH',
        customerType,
        companyName: customerType === 'BUSINESS' ? companyName.trim() : undefined,
        tradeLicense: customerType === 'BUSINESS' ? tradeLicense.trim() : undefined,
        trn: customerType === 'BUSINESS' ? trn.trim() : undefined,
        contactPerson: customerType === 'BUSINESS' ? (contactPerson.trim() || resolvedContactName) : undefined,
        contactRole: customerType === 'BUSINESS' ? contactRole.trim() : undefined,
        poNumber: customerType === 'BUSINESS' ? poNumber.trim() : undefined,
        partnerTier: customerType === 'BUSINESS' ? partnerTier : undefined,
        paymentTerms: customerType === 'BUSINESS' ? paymentTerms : 'PREPAID',
        taxTreatment,
        shippingAddress: shippingAddr,
        billingAddress: billingAddr,
        items: orderItems.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
        paymentMethod,
        paymentStatus,
        orderStatus,
        notes: orderNotes,
      };

      const res = await ApiClient.post<any>('/admin/orders', payload, { token });
      setCreateSuccess(`Sales Order ${res.orderNumber || 'Created'} successfully saved to the database! Inventory decremented.`);

      fetchOrders();

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setOrderItems([]);
        setCreateSuccess('');
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'Failed to create sales order.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus, note?: string) => {
    if (!token) return;
    setUpdatingStatus(true);
    try {
      await ApiClient.put(`/admin/orders/${orderId}/status`, { status: nextStatus, note }, { token });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: nextStatus,
          status: nextStatus,
        });
      }
      showOrderToast('success', `Order status updated to ${nextStatus}.`);
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      showOrderToast('error', err.message || 'Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const normStatus = getNormalizedStatus(o);
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || normStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert Banner */}
      {orderToast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            orderToast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <span>{orderToast.message}</span>
          <button
            onClick={() => setOrderToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Global Fulfillment & Logistics Pipeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Orders & Verified E-Bills
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Track hardware dispatches, multi-seller item allocations, courier updates, and payment settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search orders by order number, customer name, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'SHIPPED', label: 'Shipped' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[950px] text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Order # & Timestamp</th>
                <th className="py-3.5 px-4 font-bold min-w-[200px]">Customer Consignee</th>
                <th className="py-3.5 px-4 font-bold min-w-[220px]">Items Breakdown</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px] whitespace-nowrap">Net Total</th>
                <th className="py-3.5 px-4 font-bold min-w-[110px] whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 font-bold text-right min-w-[120px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{order.orderNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{formatDate(order.createdAt)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-200">
                          {order.companyName || order.customerName}
                        </span>
                        {order.customerType === 'BUSINESS' || order.companyName ? (
                          <span className="text-[9px] font-bold font-mono uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            B2B
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {order.companyName ? `${order.customerName} • ` : ''}{order.customerEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-300 font-bold">{order.items?.length || 0} hardware items</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">
                        {order.items?.map(i => i.productName).join(', ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatPrice(order.total)}
                    </td>

                    <td className="py-3.5 px-4">
                      {(() => {
                        const norm = getNormalizedStatus(order);
                        const cfg = getStatusBadgeConfig(norm);
                        const StatusIcon = cfg.icon;
                        return (
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${cfg.badgeClass}`}
                            >
                              <StatusIcon className="w-3 h-3 shrink-0" />
                              <span>{cfg.label}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 whitespace-nowrap">
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                              <span>{cfg.itemsStatus}</span>
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEBillOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Open Digital Tax E-Bill"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No orders match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SALES ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex justify-center items-start sm:items-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
            {/* Modal Fixed Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Admin Direct Dispatch &amp; Procurement</span>
                </div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                  Create New Customer Sales Order
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Directly dispatch inventory, issue digital e-bills, and persist transaction records into the database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 flex-1 custom-scrollbar">
              {/* Notifications */}
              {createError && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              {createSuccess && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <form id="createSalesOrderForm" onSubmit={handleCreateSalesOrder} className="space-y-4 sm:space-y-5 text-xs">
                {/* SECTION 1: CLIENT & CONSIGNEE SPECIFICATION */}
                <div className="p-3 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3.5 sm:space-y-4">
                  {/* Top Bar: Title & Database vs Manual Pill Switch */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 sm:pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2 flex-wrap">
                          <span>Client &amp; Consignee Specification</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {clientSelectionMode === 'DATABASE' ? 'Database Mode' : 'Manual Entry'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {clientSelectionMode === 'DATABASE'
                            ? 'Fetch existing customer/business record from database or switch to manual entry'
                            : 'Manually enter fresh client details for this sales record without database linkage'}
                        </p>
                      </div>
                    </div>

                    {/* Mode Segmented Pill Switch: "Pick Database Client" vs "Add New Client Manually" */}
                    <div className="grid grid-cols-2 sm:inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setClientSelectionMode('DATABASE');
                          if (availableCustomers.length > 0 && !selectedCustomerId) {
                            handleSelectCustomer(availableCustomers[0].id);
                          }
                        }}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                          clientSelectionMode === 'DATABASE'
                            ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Pick Database Client</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setClientSelectionMode('MANUAL');
                          setSelectedCustomerId('');
                        }}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                          clientSelectionMode === 'MANUAL'
                            ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Add New Client Manually</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Type Selector: Retail Customer (B2C) vs Business Seller / B2B Commercial Partner */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Client Entity Classification
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCustomerType('INDIVIDUAL')}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          customerType === 'INDIVIDUAL'
                            ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${
                          customerType === 'INDIVIDUAL'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">Individual Retail Customer</span>
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shrink-0">
                              B2C
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            Direct sales to end-user retail consumer. Standard domestic delivery.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCustomerType('BUSINESS')}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          customerType === 'BUSINESS'
                            ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${
                          customerType === 'BUSINESS'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">Business Seller / Commercial Partner</span>
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shrink-0">
                              B2B / Reseller
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            Corporate entity, reseller partner, wholesale procurement with TRN / CRN tax accounting.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Database Client Picker Bar (Only shown in DATABASE mode) */}
                  {clientSelectionMode === 'DATABASE' && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 min-w-0 flex-1 w-full">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          Pick Database Client:
                        </label>
                        <select
                          value={selectedCustomerId}
                          onChange={e => handleSelectCustomer(e.target.value)}
                          className="w-full sm:flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 truncate"
                        >
                          <option value="">-- Select Client from Database ({availableCustomers.length} registered) --</option>
                          {availableCustomers.map(c => {
                            const isReseller = c.role === 'RESELLER';
                            return (
                              <option key={c.id} value={c.id}>
                                {c.companyName || c.name || c.fullName || c.email} ({c.email}) {isReseller ? '★ [Reseller]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {selectedCustomerId && (
                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 w-full sm:w-auto">
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>DB Record Linked</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleClearCustomerForm}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Reset client fields"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="sm:hidden text-slate-500">Reset</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Mode Banner */}
                  {clientSelectionMode === 'MANUAL' && (
                    <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Plus className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] font-medium">
                          <strong>Manual Direct Entry Active:</strong> Enter consignee or business seller information directly below. This order will be recorded without linking to an existing account.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearCustomerForm}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear Form</span>
                      </button>
                    </div>
                  )}

                  {/* CLIENT SPECIFICATION FIELDS */}
                  {customerType === 'INDIVIDUAL' ? (
                    /* RETAIL CUSTOMER (B2C) FIELDS */
                    <div className="space-y-3.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Customer Full Name <span className="text-purple-600 dark:text-purple-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="e.g. Tariq Al-Mansoor"
                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Email Address <span className="text-purple-600 dark:text-purple-400">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={customerEmail}
                            onChange={e => setCustomerEmail(e.target.value)}
                            placeholder="e.g. customer@domain.ae"
                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            placeholder="+971 4 800 1234"
                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Shipping Street Address
                          </label>
                          <input
                            type="text"
                            value={addressLine1}
                            onChange={e => setAddressLine1(e.target.value)}
                            placeholder="Street, Building, Apartment / Villa Number"
                            className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            City & Country
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={city}
                              onChange={e => setCity(e.target.value)}
                              placeholder="Dubai"
                              className="col-span-2 w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                            />
                            <input
                              type="text"
                              value={country}
                              onChange={e => setCountry(e.target.value)}
                              placeholder="AE"
                              className="col-span-1 w-full text-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-bold uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BUSINESS SELLER / B2B COMMERCIAL PARTNER FIELDS */
                    <div className="space-y-4 pt-1">
                      {/* Sub-section 1: Commercial Legal Entity Profile */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>1. Commercial Legal Entity Profile</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">GCC / UAE Commercial Compliance</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Company / Legal Trading Name <span className="text-purple-600 dark:text-purple-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={companyName}
                              onChange={e => setCompanyName(e.target.value)}
                              placeholder="e.g. Apex Hardware Technologies FZ-LLC"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Trade License / CRN
                            </label>
                            <input
                              type="text"
                              value={tradeLicense}
                              onChange={e => setTradeLicense(e.target.value)}
                              placeholder="e.g. CN-1049281-DXB"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Tax Registration (TRN / VAT ID)
                            </label>
                            <input
                              type="text"
                              value={trn}
                              onChange={e => setTrn(e.target.value)}
                              placeholder="15-digit TRN: 100xxxxxxxx0003"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Commercial Partner Tier / Reseller Category
                            </label>
                            <select
                              value={partnerTier}
                              onChange={e => setPartnerTier(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                            >
                              <option value="CERTIFIED_PARTNER">Certified Technology Reseller</option>
                              <option value="GOLD_PARTNER">Gold Wholesale Partner (Volume Tier)</option>
                              <option value="PLATINUM_ENTERPRISE">Platinum Enterprise Tier</option>
                              <option value="GOVERNMENT_ACADEMIC">Government / Educational Institution</option>
                              <option value="COMMERCIAL_BUYER">Direct Commercial / Corporate Buyer</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Client PO / Purchase Contract Ref #
                            </label>
                            <input
                              type="text"
                              value={poNumber}
                              onChange={e => setPoNumber(e.target.value)}
                              placeholder="e.g. PO-2026-APEX-8891"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sub-section 2: Authorized Representative & Official Contact */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>2. Authorized Representative & Corporate Contact</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Recipient of Dispatch & Warranty Notices</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Contact Person Name <span className="text-purple-600 dark:text-purple-400">*</span>
                            </label>
                            <input
                              type="text"
                              required={customerType === 'BUSINESS'}
                              value={contactPerson}
                              onChange={e => {
                                setContactPerson(e.target.value);
                                if (!customerName) setCustomerName(e.target.value);
                              }}
                              placeholder="e.g. Tariq Al-Mansoor"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Job Title / Department
                            </label>
                            <input
                              type="text"
                              value={contactRole}
                              onChange={e => setContactRole(e.target.value)}
                              placeholder="e.g. VP Infrastructure Procurement"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Official Corporate Email <span className="text-purple-600 dark:text-purple-400">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={customerEmail}
                              onChange={e => setCustomerEmail(e.target.value)}
                              placeholder="e.g. procurement@apexsolutions.ae"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Phone / Extension
                            </label>
                            <input
                              type="text"
                              value={customerPhone}
                              onChange={e => setCustomerPhone(e.target.value)}
                              placeholder="+971 4 800 1234 ext 201"
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sub-section 3: Commercial Credit Terms & VAT Treatment */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>3. Commercial Settlement & Tax Treatment</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Affects dynamic VAT computation</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Commercial Payment / Credit Terms
                            </label>
                            <select
                              value={paymentTerms}
                              onChange={e => setPaymentTerms(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                            >
                              <option value="PREPAID">Prepaid / Wire Advance (Immediate)</option>
                              <option value="NET_15">Net 15 Days (Commercial Terms)</option>
                              <option value="NET_30">Net 30 Days (Standard Corporate Credit)</option>
                              <option value="NET_60">Net 60 Days (Enterprise Approved Line)</option>
                              <option value="LC">Letter of Credit (L/C Confirmed)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Tax Treatment / VAT Exemption Category
                            </label>
                            <select
                              value={taxTreatment}
                              onChange={e => setTaxTreatment(e.target.value as any)}
                              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium font-mono"
                            >
                              <option value="STANDARD">Standard Rate (5% UAE VAT)</option>
                              <option value="FREE_ZONE">Designated Free Zone Exemption (0% VAT - Art. 45)</option>
                              <option value="EXPORT">Direct Export Outside State (0% VAT)</option>
                              <option value="EXEMPT">Tax Exempt Entity / Diplomatic (0% VAT)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Sub-section 4: Delivery and Separate Billing Addresses */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>4. Delivery & Commercial Invoicing Addresses</span>
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sameAsShipping}
                              onChange={e => setSameAsShipping(e.target.checked)}
                              className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                            />
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              Billing address same as delivery address
                            </span>
                          </label>
                        </div>

                        {/* Delivery / Physical Shipping Address */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Physical Delivery / Warehouse Dispatch Destination
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                value={addressLine1}
                                onChange={e => setAddressLine1(e.target.value)}
                                placeholder="Street, Warehouse Bay, Unit / Floor"
                                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="City (e.g. Dubai)"
                                className="col-span-2 w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                              />
                              <input
                                type="text"
                                value={country}
                                onChange={e => setCountry(e.target.value)}
                                placeholder="AE"
                                className="col-span-1 w-full text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold uppercase"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Separate Billing Address if unchecked */}
                        {!sameAsShipping && (
                          <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in-0 duration-200">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1.5">
                              Official Invoicing & Tax Billing Address
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <input
                                  type="text"
                                  value={billingAddressLine1}
                                  onChange={e => setBillingAddressLine1(e.target.value)}
                                  placeholder="Headquarters, Corporate Tower, Suite #"
                                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={billingCity}
                                  onChange={e => setBillingCity(e.target.value)}
                                  placeholder="City"
                                  className="col-span-2 w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                                />
                                <input
                                  type="text"
                                  value={billingCountry}
                                  onChange={e => setBillingCountry(e.target.value)}
                                  placeholder="AE"
                                  className="col-span-1 w-full text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold uppercase"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 2: HARDWARE LINE ITEMS */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span>Hardware Line Items</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">
                        {orderItems.length}
                      </span>
                    </div>

                    {/* Add Product Selector: Combobox (Typing Suggestions + Dropdown Browsing) */}
                    <div className="flex items-center gap-2 w-full sm:w-auto relative" ref={productComboboxRef}>
                      <div className="relative flex-1 sm:w-80 md:w-96">
                        {/* Search Icon */}
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                        {/* Search / Dropdown Trigger Input */}
                        <input
                          type="text"
                          value={productSearchQuery}
                          onChange={e => {
                            setProductSearchQuery(e.target.value);
                            setSelectedProductIdToAdd('');
                            setIsProductDropdownOpen(true);
                          }}
                          onFocus={() => setIsProductDropdownOpen(true)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddProduct();
                            }
                          }}
                          placeholder="Search or select hardware by name, SKU..."
                          className="w-full bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white pl-9 pr-14 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs placeholder:text-slate-400 transition-all"
                        />

                        {/* Right input action buttons: Clear & Chevron */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {productSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductSearchQuery('');
                                setSelectedProductIdToAdd('');
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Clear search"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setIsProductDropdownOpen(prev => !prev)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Toggle catalog dropdown"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isProductDropdownOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''}`} />
                          </button>
                        </div>

                        {/* Autocomplete Dropdown Popover */}
                        {isProductDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-72 flex flex-col backdrop-blur-md animate-in fade-in-0 zoom-in-95">
                            {/* Dropdown Header */}
                            <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <span>
                                {productSearchQuery.trim()
                                  ? `${filteredProducts.length} matching items`
                                  : `Hardware Catalog (${availableProducts.length} items)`}
                              </span>
                              <span className="text-[9px] lowercase text-purple-600 dark:text-purple-400 font-mono">click item to select</span>
                            </div>

                            {/* Dropdown List */}
                            <div className="overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60">
                              {filteredProducts.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
                                  <div>No products matching &ldquo;{productSearchQuery}&rdquo;</div>
                                  <div className="text-[10px] text-slate-400">Try searching by category, brand, or SKU</div>
                                </div>
                              ) : (
                                filteredProducts.map(p => {
                                  const isSelected = selectedProductIdToAdd === p.id;
                                  return (
                                    <div
                                      key={p.id}
                                      onClick={() => handleSelectProduct(p)}
                                      className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors text-left group ${
                                        isSelected
                                          ? 'bg-purple-50/80 dark:bg-purple-950/30'
                                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <img
                                          src={p.thumbnail || p.primaryImage || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                                          alt=""
                                          className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-800"
                                        />
                                        <div className="min-w-0">
                                          <div className={`font-bold text-xs truncate ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
                                            {p.name}
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                            <span>SKU: {p.sku || 'N/A'}</span>
                                            <span>•</span>
                                            <span className={p.stock > 10 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : p.stock > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-rose-500 font-bold'}>
                                              {p.stock > 0 ? `Stock: ${p.stock}` : 'Out of stock'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="font-mono font-black text-slate-900 dark:text-white text-xs">
                                          {formatPrice(p.price)}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddProduct(p);
                                          }}
                                          className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-300 font-bold text-[10px] transition-all border border-purple-200 dark:border-purple-800 flex items-center gap-1 cursor-pointer"
                                          title="Add directly to sales order"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Add</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Main Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAddProduct()}
                        disabled={!selectedProductIdToAdd && filteredProducts.length === 0}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white/50 dark:bg-slate-900/50 space-y-1.5">
                      <PackageCheck className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 opacity-60" />
                      <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">No hardware line items added yet</div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Select a product from the catalog dropdown above and click <span className="font-bold text-purple-600 dark:text-purple-400">+ Add</span>.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {orderItems.map(item => (
                        <div
                          key={item.productId}
                          className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <img
                              src={item.thumbnail || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                              alt=""
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 dark:text-white truncate text-xs">{item.productName}</div>
                              <div className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                                SKU: {item.sku} • Stock: {item.stock} • Unit: {formatPrice(item.price)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 w-full sm:w-auto">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={item.stock || 999}
                                value={item.quantity}
                                onChange={e => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)}
                                className="w-10 text-center bg-transparent font-bold text-slate-900 dark:text-white text-xs focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="font-mono font-black text-slate-900 dark:text-white min-w-[75px] sm:min-w-[85px] text-right text-xs">
                              {formatPrice(item.price * item.quantity)}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 3: PAYMENT, SETTLEMENT & LOGISTICS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <span>Payment & Fulfillment Parameters</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                        >
                          <option value="CREDIT_CARD">Credit Card</option>
                          <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                          <option value="WALLET">Enterprise Wallet</option>
                          <option value="COD">Cash On Delivery</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Settlement Status
                        </label>
                        <select
                          value={paymentStatus}
                          onChange={e => setPaymentStatus(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                        >
                          <option value="PAID">PAID (Verified)</option>
                          <option value="PENDING">PENDING (Awaiting)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Initial Order Status
                        </label>
                        <select
                          value={orderStatus}
                          onChange={e => setOrderStatus(e.target.value as any)}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                        >
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Internal Sales Note
                        </label>
                        <input
                          type="text"
                          value={orderNotes}
                          onChange={e => setOrderNotes(e.target.value)}
                          placeholder="e.g. VIP client procurement"
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span>Real-time Financial Computation</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>Subtotal ({orderItems.reduce((acc, i) => acc + i.quantity, 0)} units):</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPrice(itemsSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>
                          {isZeroRatedTax
                            ? `VAT Exemption (${taxTreatment === 'FREE_ZONE' ? 'Free Zone 0%' : taxTreatment === 'EXPORT' ? 'Export 0%' : 'Tax Exempt 0%'}):`
                            : 'UAE VAT (5% Standard):'}
                        </span>
                        <span className={`font-mono ${isZeroRatedTax ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {isZeroRatedTax ? 'د.إ 0.00 (Zero-Rated)' : formatPrice(vatTax)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                        <span>Dispatch Shipping:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {shippingFee === 0 ? 'FREE (Enterprise Tier)' : formatPrice(shippingFee)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-sm font-black text-slate-900 dark:text-white pt-2.5 border-t border-slate-200 dark:border-slate-800">
                        <span>Grand Total:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 text-lg font-black">
                          {formatPrice(orderGrandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Fixed Footer Actions */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Order Total:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {formatPrice(orderGrandTotal)}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="createSalesOrderForm"
                  disabled={creatingOrder || orderItems.length === 0}
                  className="flex-2 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  {creatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Persisting Order...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4 shrink-0" />
                      <span>Confirm &amp; Generate Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER INSPECTION & STATUS MANAGEMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex justify-center items-start sm:items-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
            {/* Modal Fixed Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
              <div>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Order Fulfillment & Lifecycle</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedOrder.orderNumber}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                  {(() => {
                    const norm = getNormalizedStatus(selectedOrder);
                    const cfg = getStatusBadgeConfig(norm);
                    const StatusIcon = cfg.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${cfg.badgeClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 custom-scrollbar">
              {/* Consignee & Payment Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                  <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Consignee & Client Details</span>
                    </div>
                    {selectedOrder.customerType === 'BUSINESS' || selectedOrder.companyName ? (
                      <span className="text-[9px] font-bold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                        B2B Commercial Partner
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        Retail Client
                      </span>
                    )}
                  </div>
                  {selectedOrder.companyName && (
                    <div className="font-black text-slate-900 dark:text-white text-sm">{selectedOrder.companyName}</div>
                  )}
                  <div className={`${selectedOrder.companyName ? 'text-xs text-slate-700 dark:text-slate-300 font-semibold' : 'font-bold text-slate-900 dark:text-white text-sm'}`}>
                    {selectedOrder.contactPerson ? `Attn: ${selectedOrder.contactPerson}${selectedOrder.contactRole ? ` (${selectedOrder.contactRole})` : ''}` : selectedOrder.customerName}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">{selectedOrder.customerEmail} • {selectedOrder.customerPhone || 'No phone'}</div>
                  {selectedOrder.tradeLicense && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      Trade License: <strong className="text-slate-800 dark:text-slate-200">{selectedOrder.tradeLicense}</strong>
                    </div>
                  )}
                  {selectedOrder.trn && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      TRN / VAT ID: <strong className="text-slate-800 dark:text-slate-200">{selectedOrder.trn}</strong>
                    </div>
                  )}
                  {selectedOrder.poNumber && (
                    <div className="text-[11px] text-purple-700 dark:text-purple-400 font-mono font-bold">
                      PO Reference: #{selectedOrder.poNumber}
                    </div>
                  )}
                  {selectedOrder.paymentTerms && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Payment Terms: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.paymentTerms}</span>
                    </div>
                  )}
                  <div className="text-slate-700 dark:text-slate-300 font-medium pt-1">{selectedOrder.shippingAddress?.addressLine1}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.country}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
                  <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Financial & Payment Details</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Method: {selectedOrder.paymentMethod || 'CREDIT_CARD'}</div>
                  <div className="text-slate-600 dark:text-slate-400">Coupon Discount: {selectedOrder.discount ? formatPrice(selectedOrder.discount) : 'None'}</div>
                  <div className="text-slate-600 dark:text-slate-400">Wallet Applied: {selectedOrder.walletAmountUsed ? formatPrice(selectedOrder.walletAmountUsed) : 'د.إ 0.00'}</div>
                  <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base pt-1">
                    Net Settlement: {formatPrice(selectedOrder.total)}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Hardware Line Items ({selectedOrder.items?.length || 0})</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="p-3.5 space-y-2 hover:bg-white/50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                            alt={item.productName}
                            className="w-9 h-9 rounded-xl object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <div className="font-mono font-black text-slate-900 dark:text-white text-xs">
                            {formatPrice(item.subtotal)}
                          </div>
                          {(() => {
                            const norm = getNormalizedStatus(selectedOrder);
                            const cfg = getStatusBadgeConfig(norm);
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                                <span>{cfg.label}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Serial Number Assignment & Warranty Bar */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Serial Number(s):</span>
                          {item.serialNumbers && item.serialNumbers.length > 0 ? (
                            <span className="font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                              {item.serialNumbers.join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Unassigned (Required for Warranty)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenSerialModal(idx)}
                          className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {item.serialNumbers && item.serialNumbers.length > 0 ? 'Edit S/N' : '+ Assign S/N'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Transition Actions */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-3 shadow-xs">
                <div className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Update Order Fulfillment Status</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(st => {
                    const isCurrent = getNormalizedStatus(selectedOrder) === st;
                    return (
                      <button
                        key={st}
                        disabled={updatingStatus || isCurrent}
                        onClick={() => handleUpdateStatus(selectedOrder.id, st, `Status transitioned to ${st} by Admin`)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs'
                        }`}
                      >
                        Mark as {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Fixed Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setEBillOrder(selectedOrder)}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center justify-center sm:justify-start gap-1.5 transition-colors cursor-pointer py-1"
              >
                <FileText className="w-4 h-4" />
                <span>Open Digital E-Bill Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERIAL NUMBER ASSIGNMENT MODAL */}
      {serialModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Assign Hardware Serial Numbers</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{serialModal.productName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSerialModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Line Item Quantity:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{serialModal.quantity} unit(s)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter hardware serial numbers separated by commas or line breaks. These serials bind to manufacturer warranty validation and RMA claims.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Serial Number(s) (comma-separated):
                </label>
                <textarea
                  rows={3}
                  value={serialModal.serialNumbers}
                  onChange={e => setSerialModal({ ...serialModal, serialNumbers: e.target.value })}
                  placeholder="e.g. SN-DXB-948210, SN-DXB-948211"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {serialModal.serialNumbers && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {serialModal.serialNumbers
                    .split(/[\n,]+/)
                    .map(s => s.trim().toUpperCase())
                    .filter(Boolean)
                    .map((sn, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-800"
                      >
                        #{idx + 1}: {sn}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSerialModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingSerial}
                onClick={handleSaveSerialNumbers}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {savingSerial ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Serial Numbers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL E-BILL TAX INVOICE MODAL */}
      <DigitalEBillModal
        order={eBillOrder}
        isOpen={!!eBillOrder}
        onClose={() => setEBillOrder(null)}
      />
    </div>
  );
}

