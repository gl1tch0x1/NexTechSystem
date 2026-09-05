import { v4 as uuidv4 } from 'uuid';
import { orderRepository } from '../repositories/order.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { pricingService } from './pricing.service.js';
import { inventoryService } from './inventory.service.js';
import { walletService } from './wallet.service.js';
import { ebillService } from './ebill.service.js';
import { auditService } from './audit.service.js';
import { Order, OrderStatus, PaymentMethod, PaymentStatus, Address, OrderItem } from '../types/index.js';
import { dbStore } from '../config/db-store.js';

export interface CreateOrderDTO {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  walletAmountToUse?: number;
  notes?: string;
}

export class OrderService {
  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Order must contain at least one item');
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

    // 2. Fetch customer wallet balance if requesting wallet deduction
    let userWalletBalance = 0;
    if (dto.walletAmountToUse && dto.walletAmountToUse > 0) {
      userWalletBalance = await walletService.getBalance(dto.userId);
    }

    // 3. Authoritative pricing calculation
    const pricing = await pricingService.calculateOrderTotals({
      items: dto.items,
      productsMap,
      couponCode: dto.couponCode,
      requestedWalletDeduction: dto.walletAmountToUse,
      userWalletBalance,
    });

    // 4. Verify stock availability
    for (const item of dto.items) {
      const { available, currentStock } = await inventoryService.checkStock(item.productId, item.quantity);
      if (!available) {
        const prod = productsMap.get(item.productId);
        throw new Error(`Insufficient stock for "${prod?.name}". Only ${currentStock} remaining.`);
      }
    }

    return dbStore.runTransaction(async () => {
      // 5. Decrement inventory
      await inventoryService.deductStock(dto.items);

      // 6. Deduct from wallet if used
      if (pricing.walletAmountUsed > 0) {
        await walletService.debitWallet({
          userId: dto.userId,
          amount: pricing.walletAmountUsed,
          reason: `Payment for Order #${dto.customerName}`,
          referenceId: 'pending_order',
        });
      }

      // 7. Format order items with seller attribution
      const orderItems: OrderItem[] = pricing.items.map(item => {
        const prod = productsMap.get(item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          slug: item.slug,
          thumbnail: item.image,
          quantity: item.quantity,
          unitPrice: item.salePrice || item.price,
          discount: item.salePrice ? item.price - item.salePrice : 0,
          subtotal: item.subtotal,
          sellerType: item.sellerType,
          resellerId: item.resellerId,
          resellerCode: item.resellerCode,
          specifications: prod?.specifications,
        };
      });

      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderId = `order_${uuidv4()}`;

      // 8. Construct Order
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
        walletAmountUsed: pricing.walletAmountUsed,
        tax: pricing.tax,
        taxRate: pricing.taxRate,
        shippingFee: pricing.shippingFee,
        total: pricing.total,
        currency: pricing.currency,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        orderStatus: 'CONFIRMED',
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress,
        notes: dto.notes,
        statusHistory: [
          {
            status: 'CONFIRMED',
            note: 'Order placed successfully and inventory allocated.',
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createdOrder = await orderRepository.create(newOrder);

      // 9. Generate E-Bill Digital Invoice
      const eBill = await ebillService.generateEBill(createdOrder);
      await orderRepository.update(createdOrder.id, { eBillId: eBill.id });

      // 10. Update reseller sales statistics
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

      // 11. Audit Log
      await auditService.log({
        userId: dto.userId,
        userEmail: dto.customerEmail,
        userRole: 'CUSTOMER',
        action: 'ORDER_CREATED',
        resource: 'orders',
        resourceId: createdOrder.id,
        details: { orderNumber, total: pricing.total, itemCount: orderItems.length },
      });

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

  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string, adminUserId?: string): Promise<Order | null> {
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

    const updated = await orderRepository.update(orderId, {
      orderStatus: status,
      paymentStatus: status === 'DELIVERED' && order.paymentMethod === 'COD' ? 'PAID' : order.paymentStatus,
      statusHistory: newHistory,
    });

    if (adminUserId) {
      await auditService.log({
        userId: adminUserId,
        userEmail: 'admin@nextech.com',
        userRole: 'ADMIN',
        action: `ORDER_STATUS_${status}`,
        resource: 'orders',
        resourceId: orderId,
        details: { previousStatus: order.orderStatus, newStatus: status, note },
      });
    }

    return updated;
  }
}

export const orderService = new OrderService();
