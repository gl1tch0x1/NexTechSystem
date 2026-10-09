import { v4 as uuidv4 } from 'uuid';
import { orderRepository } from '../repositories/order.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { pricingService } from './pricing.service.js';
import { inventoryService } from './inventory.service.js';
import { ebillService } from './ebill.service.js';
import { auditService } from './audit.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { ENV } from '../config/env.js';
import { Order, OrderStatus, PaymentStatus, PaymentMethod, Address, OrderItem } from '../types/index.js';
import { notificationService } from './notification.service.js';
import { dbStore } from '../config/db-store.js';

export interface CreateOrderDTO {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{ productId: string; quantity: number; variantId?: string; locationId?: string }>;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  walletAmountToUse?: number;
  notes?: string;
  customerType?: 'INDIVIDUAL' | 'BUSINESS';
  companyName?: string;
  tradeLicense?: string;
  trn?: string;
  contactPerson?: string;
  contactRole?: string;
  poNumber?: string;
  paymentTerms?: string;
  taxTreatment?: string;
  partnerTier?: string;
}

export class OrderService {
  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    for (const item of dto.items) {
      if (!item || !item.productId || typeof item.productId !== 'string') {
        throw new Error('Invalid order item: productId is required');
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 999) {
        throw new Error(`Invalid quantity for item "${item.productId}". Must be a positive integer between 1 and 999.`);
      }
      item.quantity = qty;
    }

    // 1. Fetch products map from authoritative DB
    const productIds = dto.items.map(it => it.productId);
    const productsMap = new Map<string, any>();
    for (const pid of productIds) {
      const p = await productRepository.findById(pid);
      if (!p) {
        throw new Error(`Product not found: ${pid}`);
      }
      if (!p.isActive || p.approvalStatus !== 'APPROVED') {
        throw new Error(`Product is currently not available for purchase: ${p.name}`);
      }
      productsMap.set(pid, p);
    }



    // 3. Authoritative pricing calculation
    const pricing = await pricingService.calculateOrderTotals({
      items: dto.items,
      productsMap,
      couponCode: dto.couponCode,
      taxTreatment: dto.taxTreatment,
      paymentMethod: dto.paymentMethod,
      shippingAddress: dto.shippingAddress,
      userId: dto.userId,
    });

    // 4. Verify stock availability (respecting variant and backorder settings)
    for (const item of dto.items) {
      const { available, currentStock, allowsBackorder } = await inventoryService.checkStock(
        item.productId,
        item.quantity,
        item.variantId
      );
      if (!available && !allowsBackorder) {
        const prod = productsMap.get(item.productId);
        const variantName = item.variantId && prod?.variants
          ? ` (${prod.variants.find((v: any) => v.id === item.variantId)?.title || 'Variant'})`
          : '';
        throw new Error(`Insufficient stock for "${prod?.name}${variantName}". Only ${currentStock} remaining.`);
      }
    }

    return dbStore.runTransaction(async () => {
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderId = `order_${uuidv4()}`;

      // 5. Decrement inventory
      await inventoryService.deductStock(dto.items);

      // 6. Increment coupon usage if applied
      if (pricing.appliedCoupon) {
        await couponRepository.update(pricing.appliedCoupon.id, {
          usageCount: (pricing.appliedCoupon.usageCount || 0) + 1,
        });
      }



      // 7. Format order items with seller attribution and variant specifics
      const orderItems: OrderItem[] = pricing.items.map(item => {
        const prod = productsMap.get(item.productId);
        return {
          productId: item.productId,
          variantId: item.variantId,
          variantTitle: item.variantTitle,
          options: item.options,
          productName: item.productName,
          sku: item.sku,
          slug: item.slug,
          thumbnail: item.image,
          quantity: item.quantity,
          unitPrice: item.salePrice || item.price,
          discount: item.salePrice ? item.price - item.salePrice : 0,
          chargeTax: item.chargeTax,
          subtotal: item.subtotal,
          sellerType: item.sellerType,
          resellerId: item.resellerId,
          resellerCode: item.resellerCode,
          specifications: prod?.specifications,
        };
      });

      // 8. Determine approval requirement based on stock origin
      const hasResellerStock = orderItems.some(
        item => item.sellerType === 'RESELLER' || Boolean(item.resellerId)
      );

      const isBnpl = dto.paymentMethod === 'TAMARA' || dto.paymentMethod === 'TABBY';

      const initialOrderStatus: OrderStatus = hasResellerStock
        ? 'PENDING_APPROVAL'
        : (isBnpl ? 'PENDING' : (dto.paymentMethod === 'COD' || dto.paymentMethod === 'IN_STORE' ? 'CONFIRMED' : 'PROCESSING'));

      const initialHistoryNote = hasResellerStock
        ? 'Order contains partner/reseller fulfilled items. Status: Pending to Approve. Awaiting executive/admin verification.'
        : (isBnpl
            ? `Order initiated via ${dto.paymentMethod} BNPL. Awaiting customer authorization and installment approval.`
            : (dto.paymentMethod === 'IN_STORE'
                ? 'Order confirmed for In-Store Pickup & Payment. Reserved for customer at showroom.'
                : 'Order confirmed automatically. Sourced directly from NexTech Inventory.'));

      // 9. Construct Order
      const newOrder: Order = {
        id: orderId,
        orderNumber,
        userId: dto.userId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        items: orderItems,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        couponCode: pricing.couponCode,
        inStoreDiscount: pricing.inStoreDiscount,
        inStoreDiscountRate: pricing.inStoreDiscountRate,
        walletAmountUsed: 0,
        tax: pricing.tax,
        taxRate: pricing.taxRate,
        shippingFee: pricing.shippingFee,
        paymentSurcharge: pricing.paymentSurcharge,
        paymentSurchargeRate: pricing.paymentSurchargeRate,
        codFee: pricing.codFee,
        total: pricing.total,
        currency: pricing.currency,
        paymentMethod: dto.paymentMethod,
        paymentStatus: (dto.paymentMethod === 'COD' || dto.paymentMethod === 'IN_STORE' || isBnpl) ? 'PENDING' : 'PAID',
        inStoreReservationExpiry: dto.paymentMethod === 'IN_STORE'
          ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          : undefined,
        orderStatus: initialOrderStatus,
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress,
        notes: dto.notes,
        customerType: dto.customerType || (dto.companyName ? 'BUSINESS' : 'INDIVIDUAL'),
        companyName: dto.companyName,
        tradeLicense: dto.tradeLicense,
        trn: dto.trn,
        contactPerson: dto.contactPerson,
        contactRole: dto.contactRole,
        poNumber: dto.poNumber,
        paymentTerms: dto.paymentTerms,
        taxTreatment: dto.taxTreatment,
        partnerTier: dto.partnerTier,
        statusHistory: [
          {
            status: initialOrderStatus,
            note: initialHistoryNote,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdOrder = await orderRepository.create(newOrder);

      // 10. Generate E-Bill Digital Invoice
      const eBill = await ebillService.generateEBill(createdOrder);
      await orderRepository.update(createdOrder.id, { eBillId: eBill.id });

      // 11. Update reseller sales statistics
      for (const item of orderItems) {
        if (item.resellerId) {
          const reseller = await resellerRepository.findById(item.resellerId);
          if (reseller) {
            await resellerRepository.update(reseller.id, {
              salesStats: {
                totalRevenue: (reseller.salesStats?.totalRevenue || 0) + item.subtotal,
                totalOrders: (reseller.salesStats?.totalOrders || 0) + 1,
                unitsSold: (reseller.salesStats?.unitsSold || 0) + item.quantity,
              },
            });
          }
        }
      }

      // 12. Audit Log
      await auditService.log({
        userId: dto.userId,
        userEmail: dto.customerEmail,
        userRole: 'CUSTOMER',
        action: 'ORDER_CREATED',
        resource: 'orders',
        resourceId: createdOrder.id,
        details: {
          orderNumber,
          total: pricing.total,
          itemCount: orderItems.length,
          status: initialOrderStatus,
          hasResellerStock,
        },
      });

      // 13. Human-in-the-Loop Orchestration: Dispatch to Admin Dashboard, Email, Discord & Telegram
      // Only triggered when order contains reseller stock requiring executive approval
      if (hasResellerStock) {
        notificationService.notifyNewOrderPendingApproval(createdOrder).catch(err => {
          console.error('[OrderService] HITL Notification dispatch error:', err);
        });
      }

      return createdOrder;
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    return orderRepository.findById(id);
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return orderRepository.findByUserId(userId);
  }

  async getOrdersByReseller(resellerId: string): Promise<Order[]> {
    return orderRepository.findByResellerId(resellerId);
  }

  async getAllOrders(): Promise<Order[]> {
    return orderRepository.find({ orderBy: { field: 'createdAt', direction: 'desc' } });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string, adminUserId?: string, items?: OrderItem[]): Promise<Order | null> {
    const order = await orderRepository.findById(orderId);
    if (!order) return null;

    const newHistory = [
      ...order.statusHistory,
      {
        status,
        note: note || `Status updated to ${status}`,
        timestamp: new Date().toISOString(),
        updatedBy: adminUserId,
      },
    ];

    const updates: any = {
      orderStatus: status,
      paymentStatus: status === 'DELIVERED' && (order.paymentMethod === 'COD' || order.paymentMethod === 'IN_STORE') ? 'PAID' : order.paymentStatus,
      statusHistory: newHistory,
    };

    if (items && Array.isArray(items) && items.length > 0) {
      updates.items = items;
    }

    const updated = await orderRepository.update(orderId, updates);

    if (adminUserId) {
      const actingAdmin = await userRepository.findById(adminUserId);
      await auditService.log({
        userId: adminUserId,
        userEmail: actingAdmin?.email || ENV.ADMIN_DEFAULT_EMAIL,
        userRole: 'ADMIN',
        action: `ORDER_STATUS_${status}`,
        resource: 'orders',
        resourceId: orderId,
        details: { previousStatus: order.orderStatus, newStatus: status, note },
      });
    }

    return updated;
  }

  async updatePaymentStatus(
    orderId: string,
    status: PaymentStatus,
    paymentReference?: string,
    paymentMetadata?: any,
    note?: string
  ): Promise<Order | null> {
    const order = await orderRepository.findById(orderId);
    if (!order) return null;

    let targetOrderStatus = order.orderStatus;
    if (status === 'PAID') {
      targetOrderStatus = order.orderStatus === 'PENDING' ? 'PROCESSING' : order.orderStatus;
    } else if (status === 'FAILED') {
      targetOrderStatus = order.orderStatus === 'PENDING' ? 'CANCELLED' : order.orderStatus;
    }

    const historyEntry = {
      status: targetOrderStatus,
      note: note || `Payment status updated to ${status}${paymentReference ? ` (Ref: ${paymentReference})` : ''}`,
      timestamp: new Date().toISOString(),
    };

    const updates: any = {
      paymentStatus: status,
      orderStatus: targetOrderStatus,
      statusHistory: [...(order.statusHistory || []), historyEntry],
    };

    if (paymentReference) {
      updates.paymentReference = paymentReference;
    }

    if (paymentMetadata) {
      updates.paymentMetadata = {
        ...(order.paymentMetadata || {}),
        ...paymentMetadata,
      };
    }

    const updated = await orderRepository.update(orderId, updates);
    return updated;
  }

  async approveOrder(
    orderId: string,
    channel: 'DASHBOARD' | 'DISCORD' | 'TELEGRAM' | 'EMAIL' | 'CHATOPS',
    approverId?: string,
    note?: string
  ): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.orderStatus !== 'PENDING_APPROVAL') {
      if (order.orderStatus === 'CONFIRMED') {
        return order; // Idempotent return if already confirmed
      }
      throw new Error(`Order #${order.orderNumber} is in '${order.orderStatus}' status and cannot be approved.`);
    }

    const approvalNote = note || `Order verified and approved by admin via ${channel}. Inventory allocation confirmed.`;
    const newHistory = [
      ...order.statusHistory,
      {
        status: 'CONFIRMED' as OrderStatus,
        note: approvalNote,
        timestamp: new Date().toISOString(),
        updatedBy: approverId || `CHATOPS_${channel}`,
      },
    ];

    const updated = await orderRepository.update(orderId, {
      orderStatus: 'CONFIRMED',
      statusHistory: newHistory,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new Error(`Failed to update order status for ${orderId}`);
    }

    // Audit log
    await auditService.log({
      userId: approverId || 'system_chatops',
      userEmail: approverId ? ENV.ADMIN_DEFAULT_EMAIL : 'chatops@nextech.com',
      userRole: 'ADMIN',
      action: 'ORDER_APPROVED_HITL',
      resource: 'orders',
      resourceId: orderId,
      details: {
        orderNumber: order.orderNumber,
        channel,
        approverId,
        note: approvalNote,
      },
    });

    return updated;
  }

  async rejectOrder(
    orderId: string,
    channel: 'DASHBOARD' | 'DISCORD' | 'TELEGRAM' | 'EMAIL' | 'CHATOPS',
    approverId?: string,
    reason?: string
  ): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.orderStatus !== 'PENDING_APPROVAL') {
      if (order.orderStatus === 'CANCELLED') {
        return order; // Idempotent return if already cancelled
      }
      throw new Error(`Order #${order.orderNumber} is in '${order.orderStatus}' status and cannot be rejected.`);
    }

    // 1. Restock inventory for items
    for (const item of order.items) {
      try {
        await inventoryService.restock(item.productId, item.quantity, item.variantId);
      } catch (err) {
        console.error('[OrderService] Restock failed for product:', String(item.productId).replace(/\n|\r/g, ''), err);
      }
    }



    const rejectionNote = reason || `Order rejected by administrator via ${channel}. Reserved inventory stock restored.`;
    const newHistory = [
      ...order.statusHistory,
      {
        status: 'CANCELLED' as OrderStatus,
        note: rejectionNote,
        timestamp: new Date().toISOString(),
        updatedBy: approverId || `CHATOPS_${channel}`,
      },
    ];

    const updated = await orderRepository.update(orderId, {
      orderStatus: 'CANCELLED',
      statusHistory: newHistory,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new Error(`Failed to update order status for ${orderId}`);
    }

    // Audit log
    await auditService.log({
      userId: approverId || 'system_chatops',
      userEmail: approverId ? ENV.ADMIN_DEFAULT_EMAIL : 'chatops@nextech.com',
      userRole: 'ADMIN',
      action: 'ORDER_REJECTED_HITL',
      resource: 'orders',
      resourceId: orderId,
      details: {
        orderNumber: order.orderNumber,
        channel,
        approverId,
        reason: rejectionNote,
      },
    });

    return updated;
  }

  async releaseExpiredInStoreReservations(): Promise<number> {
    const nowIso = new Date().toISOString();
    const orders = await orderRepository.find({
      where: [
        { field: 'paymentMethod', operator: '==', value: 'IN_STORE' },
        { field: 'paymentStatus', operator: '==', value: 'PENDING' },
      ],
    });

    let releasedCount = 0;
    for (const order of orders) {
      if (
        order.inStoreReservationExpiry &&
        order.inStoreReservationExpiry < nowIso &&
        order.orderStatus !== 'CANCELLED' &&
        order.orderStatus !== 'DELIVERED'
      ) {
        for (const item of order.items) {
          try {
            await inventoryService.restock(item.productId, item.quantity, item.variantId);
          } catch (err) {
            console.error('[OrderService] Restock failed for expired hold:', item.productId, err);
          }
        }

        const newHistory = [
          ...order.statusHistory,
          {
            status: 'CANCELLED' as OrderStatus,
            note: 'In-store showroom pickup reservation expired after 48 hours. Inventory hold released automatically.',
            timestamp: nowIso,
            updatedBy: 'SYSTEM_EXPIRY_CRON',
          },
        ];

        await orderRepository.update(order.id, {
          orderStatus: 'CANCELLED',
          statusHistory: newHistory,
          updatedAt: nowIso,
        });

        await auditService.log({
          userId: 'system',
          userEmail: 'system@nextech.com',
          userRole: 'ADMIN',
          action: 'ORDER_EXPIRED_RESTOCKED',
          resource: 'orders',
          resourceId: order.id,
          details: { orderNumber: order.orderNumber, reason: '48h In-store hold window expired' },
        });

        releasedCount++;
      }
    }
    return releasedCount;
  }
}

export const orderService = new OrderService();
