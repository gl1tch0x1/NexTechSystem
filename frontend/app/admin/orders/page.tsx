'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import DigitalEBillModal from '@/components/invoice/DigitalEBillModal';
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
  Layers,
  ChevronDown,
  XCircle
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Inspection modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Digital E-Bill modal state
  const [eBillOrder, setEBillOrder] = useState<Order | null>(null);

  const handleAssignSerialNumber = async (itemIdx: number) => {
    if (!selectedOrder || !token) return;
    const currentItem = selectedOrder.items[itemIdx];
    const currentSns = (currentItem.serialNumbers || []).join(', ');
    const input = prompt(
      `Enter Hardware Serial Number(s) for "${currentItem.productName}" (Comma separated if multiple units):`,
      currentSns
    );
    if (input === null) return;
    const newSns = input.split(',').map(s => s.trim()).filter(Boolean);
    const updatedItems = [...selectedOrder.items];
    updatedItems[itemIdx] = {
      ...currentItem,
      serialNumbers: newSns,
    };
    setSelectedOrder({ ...selectedOrder, items: updatedItems });
    try {
      await ApiClient.put(`/admin/orders/${selectedOrder.id}/status`, {
        status: selectedOrder.orderStatus || selectedOrder.status,
        items: updatedItems,
        note: `Hardware Serial Numbers updated for line item #${itemIdx + 1}`,
      }, { token });
      fetchOrders();
    } catch (err: any) {
      console.error('Failed to save serial number:', err);
      alert('Failed to save serial number: ' + err.message);
    }
  };

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
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: nextStatus,
          status: nextStatus,
        });
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
    const normStatus = getNormalizedStatus(o);
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || normStatus === statusFilter;
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
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
              <div>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Admin Direct Dispatch & Procurement</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Create New Customer Sales Order
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Directly dispatch inventory, issue digital e-bills, and persist transaction records into the database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close modal"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 custom-scrollbar">
              {/* Notifications */}
              {createError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              {createSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <form id="createSalesOrderForm" onSubmit={handleCreateSalesOrder} className="space-y-5 text-xs">
                {/* SECTION 1: CUSTOMER & CONSIGNEE DETAILS */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span>Customer & Consignee Selection</span>
                    </div>
                    {availableCustomers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pick Database Client:</span>
                        <select
                          value={selectedCustomerId}
                          onChange={e => handleSelectCustomer(e.target.value)}
                          className="bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-xs"
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
                        placeholder="e.g. procurement@techcorp.ae"
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Shipping Street Address
                      </label>
                      <input
                        type="text"
                        value={addressLine1}
                        onChange={e => setAddressLine1(e.target.value)}
                        placeholder="Street, Building, Unit Number"
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
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.thumbnail || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                              alt=""
                              className="w-11 h-11 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate text-xs">{item.productName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                SKU: {item.sku} • Stock: {item.stock} • Unit: {formatPrice(item.price)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 shrink-0">
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

                            <div className="font-mono font-black text-slate-900 dark:text-white min-w-[85px] text-right text-xs">
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

                    <div className="grid grid-cols-2 gap-3">
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

                    <div className="grid grid-cols-2 gap-3">
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
                        <span>UAE VAT (5%):</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{formatPrice(vatTax)}</span>
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
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Order Total:</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                  {formatPrice(orderGrandTotal)}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="createSalesOrderForm"
                  disabled={creatingOrder || orderItems.length === 0}
                  className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Persisting Order...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>Confirm & Generate Order</span>
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
                  <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Consignee Shipping Address</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedOrder.customerName}</div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">{selectedOrder.customerEmail} • {selectedOrder.customerPhone || 'No phone'}</div>
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
                          onClick={() => handleAssignSerialNumber(idx)}
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
            <div className="px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
              <button
                type="button"
                onClick={() => setEBillOrder(selectedOrder)}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Open Digital E-Bill Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Close
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

