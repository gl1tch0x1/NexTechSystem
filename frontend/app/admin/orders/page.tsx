'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import {
  ShoppingBag,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Search,
  X,
  MapPin,
  CreditCard,
  Tag,
  Eye,
  Sparkles,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  PackageCheck,
  Loader2,
  Layers
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

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Inspection modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Create Sales Order modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('Business Bay, Tower 4, Suite 1200');
  const [city, setCity] = useState('Dubai');
  const [stateRegion, setStateRegion] = useState('Dubai');
  const [country, setCountry] = useState('AE');
  const [postalCode, setPostalCode] = useState('00000');

  // Line items
  const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');

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
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateError('');
    setCreateSuccess('');
    setLoadingModalData(true);

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

      // Default to first customer if available
      if (custList.length > 0 && !selectedCustomerId) {
        const firstCust = custList[0];
        setSelectedCustomerId(firstCust.id);
        setCustomerName(firstCust.name || firstCust.fullName || '');
        setCustomerEmail(firstCust.email || '');
        setCustomerPhone(firstCust.phone || '+971 4 800 TECH');
      }
    } catch (err: any) {
      console.error('Failed to load modal data:', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      return;
    }
    const customer = availableCustomers.find(c => c.id === custId);
    if (customer) {
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

  const handleAddProduct = () => {
    if (!selectedProductIdToAdd) return;
    const prod = availableProducts.find(p => p.id === selectedProductIdToAdd);
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
  const vatTax = itemsSubtotal * 0.05;
  const shippingFee = itemsSubtotal > 5000 || itemsSubtotal === 0 ? 0 : 50;
  const orderGrandTotal = itemsSubtotal + vatTax + shippingFee;

  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (orderItems.length === 0) {
      setCreateError('Please add at least one hardware product line item to the sales order.');
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setCreateError('Customer name and email are required.');
      return;
    }

    setCreatingOrder(true);
    setCreateError('');

    try {
      const payload = {
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || '+971 4 800 TECH',
        shippingAddress: {
          id: `addr_${Date.now()}`,
          fullName: customerName.trim(),
          phone: customerPhone.trim() || '+971 4 800 TECH',
          addressLine1,
          city,
          state: stateRegion,
          country,
          postalCode,
        },
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
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
                      <div className="font-bold text-slate-900 dark:text-slate-200">{order.customerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{order.customerEmail}</div>
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
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : order.status === 'SHIPPED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : order.status === 'PROCESSING'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : order.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        {order.status}
                      </span>
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

                        <Link
                          href={`/account/orders/${order.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-tech-cyan dark:hover:text-tech-cyan hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="View Digital E-Bill"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
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
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Admin Direct Dispatch & Procurement</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Create New Customer Sales Order
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Directly dispatch inventory, issue digital e-bills, and persist transaction records into the database.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications */}
            {createError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}
            {createSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSalesOrder} className="space-y-6 text-xs">
              {/* SECTION 1: CUSTOMER & CONSIGNEE DETAILS */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Customer & Consignee Selection</span>
                  </div>
                  {availableCustomers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Pick Database Client:</span>
                      <select
                        value={selectedCustomerId}
                        onChange={e => handleSelectCustomer(e.target.value)}
                        className="bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      >
                        <option value="">-- Manual / Guest Consignee --</option>
                        {availableCustomers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.email} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Tariq Al-Mansoor"
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="e.g. procurement@techcorp.ae"
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+971 4 800 1234"
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Shipping Street Address
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      placeholder="Street, Building, Unit Number"
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      City & Country
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Dubai"
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="text"
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        placeholder="AE"
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: HARDWARE LINE ITEMS */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Hardware Line Items ({orderItems.length})</span>
                  </div>

                  {/* Add Product Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedProductIdToAdd}
                      onChange={e => setSelectedProductIdToAdd(e.target.value)}
                      className="bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 max-w-xs truncate"
                    >
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatPrice(p.price)} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {orderItems.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No hardware products added yet. Select a product from the catalog above to add to this sales order.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {orderItems.map(item => (
                      <div
                        key={item.productId}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.thumbnail || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white truncate">{item.productName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              SKU: {item.sku} • In Stock: {item.stock} • Unit: {formatPrice(item.price)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
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
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <div className="font-mono font-bold text-slate-900 dark:text-white min-w-[80px] text-right">
                            {formatPrice(item.price * item.quantity)}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
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
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Payment & Fulfillment Parameters</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      >
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                        <option value="WALLET">Enterprise Wallet</option>
                        <option value="COD">Cash On Delivery</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Settlement Status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={e => setPaymentStatus(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      >
                        <option value="PAID">PAID (Verified)</option>
                        <option value="PENDING">PENDING (Awaiting)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Initial Order Status
                      </label>
                      <select
                        value={orderStatus}
                        onChange={e => setOrderStatus(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      >
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Internal Sales Note
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={e => setOrderNotes(e.target.value)}
                        placeholder="e.g. VIP client procurement"
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Real-time Financial Computation</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal ({orderItems.reduce((acc, i) => acc + i.quantity, 0)} units):</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPrice(itemsSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>UAE VAT (5%):</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{formatPrice(vatTax)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Dispatch Shipping:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {shippingFee === 0 ? 'FREE (Enterprise Tier)' : formatPrice(shippingFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span>Grand Total:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                        {formatPrice(orderGrandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingOrder || orderItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Persisting Order to Database...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>Confirm & Generate Sales Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER INSPECTION & STATUS MANAGEMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold">
                  Order Details & Fulfillment
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedOrder.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Consignee & Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>Consignee Shipping Address</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{selectedOrder.customerName}</div>
                <div className="text-slate-600 dark:text-slate-400">{selectedOrder.customerEmail} • {selectedOrder.customerPhone || 'No phone'}</div>
                <div className="text-slate-700 dark:text-slate-300">{selectedOrder.shippingAddress?.addressLine1}</div>
                <div className="text-slate-500 dark:text-slate-400">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.country}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Financial & Payment Details</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">Payment: {selectedOrder.paymentMethod || 'CREDIT_CARD'}</div>
                <div className="text-slate-600 dark:text-slate-400">Coupon Discount: {selectedOrder.discount ? formatPrice(selectedOrder.discount) : 'None'}</div>
                <div className="text-slate-600 dark:text-slate-400">Wallet Applied: {selectedOrder.walletAmountUsed ? formatPrice(selectedOrder.walletAmountUsed) : 'د.إ 0.00'}</div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm pt-1">
                  Net Settlement: {formatPrice(selectedOrder.total)}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Hardware Line Items ({selectedOrder.items?.length || 0})</div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                        alt={item.productName}
                        className="w-8 h-8 rounded-lg object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-right">
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Transition Actions */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-3">
              <div className="text-xs font-bold text-purple-700 dark:text-purple-300">Update Order Fulfillment Status</div>
              <div className="flex flex-wrap items-center gap-2">
                {(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(st => (
                  <button
                    key={st}
                    disabled={updatingStatus || selectedOrder.status === st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st, `Status transitioned to ${st} by Admin`)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder.status === st
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Mark as {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link
                href={`/account/orders/${selectedOrder.id}`}
                target="_blank"
                className="text-xs font-bold text-tech-cyan hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                <span>Open Digital E-Bill Invoice</span>
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

