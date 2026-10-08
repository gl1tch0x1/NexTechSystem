import { ENV } from '../config/env.js';
import {
  Order,
  AdminNotification,
  AdminNotificationsResponse,
} from '../types/index.js';
import { dbStore } from '../config/db-store.js';
import { auditService } from './audit.service.js';
import { orderRepository } from '../repositories/order.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { quoteRepository } from '../repositories/quote.repository.js';

export { AdminNotification };

export class NotificationService {
  /**
   * Main Dispatcher: Fans out notifications across Discord, Telegram, Email, and Admin Dashboard
   */
  async notifyNewOrderPendingApproval(order: Order): Promise<void> {
    const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');
    const dashboardUrl = `${clientUrl}/admin/orders?orderId=${order.id}`;

    // 1. Admin In-App Dashboard Notification Queue
    try {
      const notification: AdminNotification = {
        id: `notif_order_${order.id}`,
        type: 'ORDER_PENDING_APPROVAL',
        title: `Order #${order.orderNumber} Pending Approval`,
        message: `Order #${order.orderNumber} placed by ${order.customerName} awaits admin verification.`,
        category: 'ORDERS',
        severity: 'CRITICAL',
        actionRequired: true,
        actionUrl: `/admin/orders?orderId=${order.id}`,
        actionLabel: 'Review Order',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          total: order.total,
          currency: order.currency || 'AED',
          itemsCount: order.items?.length || 1,
        },
      };
      await dbStore.create('admin_notifications', notification);
    } catch (err) {
      console.error('[NotificationService] Failed to save in-app notification:', err);
    }

    // 2. Transactional Email Notification (Admin Alert)
    this.sendAdminEmailAlert(order, dashboardUrl).catch(err =>
      console.warn('[NotificationService] Email alert notice:', err?.message || err)
    );

    // 3. Discord Webhook ChatOps
    this.sendDiscordWebhook(order, dashboardUrl).catch(err =>
      console.warn('[NotificationService] Discord webhook notice:', err?.message || err)
    );

    // 4. Telegram Bot ChatOps
    this.sendTelegramNotification(order, dashboardUrl).catch(err =>
      console.warn('[NotificationService] Telegram notification notice:', err?.message || err)
    );

    // 5. Audit Log
    await auditService.log({
      userId: order.userId,
      userEmail: order.customerEmail,
      userRole: 'CUSTOMER',
      action: 'ORDER_PENDING_APPROVAL_DISPATCHED',
      resource: 'orders',
      resourceId: order.id,
      details: {
        orderNumber: order.orderNumber,
        channels: ['DASHBOARD', 'EMAIL', 'DISCORD', 'TELEGRAM'],
      },
    });
  }

  /**
   * Channel 1: Discord Rich Embed Webhook
   */
  private async sendDiscordWebhook(
    order: Order,
    dashboardUrl: string
  ): Promise<void> {
    const webhookUrl = ENV.DISCORD_WEBHOOK_URL;
    const itemsPreview = order.items
      .map(it => `• **${it.quantity}x** ${it.productName} (${order.currency} ${it.unitPrice.toLocaleString()})`)
      .slice(0, 5)
      .join('\n');

    const totalFormatted = `${order.currency} ${(order.total || 0).toLocaleString()}`;

    const discordPayload = {
      username: 'NexTech Order Approval Bot',
      avatar_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80',
      embeds: [
        {
          title: `⏳ ORDER AWAITING APPROVAL: #${order.orderNumber}`,
          description: `A new customer order has been placed and is **held in queue** awaiting executive sign-off before inventory release.`,
          color: 0xf59e0b, // Amber 500
          fields: [
            {
              name: '👤 Customer',
              value: `**${order.customerName}**\n${order.customerEmail}\n${order.customerPhone || 'Phone on file'}`,
              inline: true,
            },
            {
              name: '💳 Payment & Method',
              value: `${order.paymentMethod}\nStatus: **${order.paymentStatus}**`,
              inline: true,
            },
            {
              name: '📍 Shipping City',
              value: `${order.shippingAddress?.city || 'Dubai'}, UAE`,
              inline: true,
            },
            {
              name: `📦 Hardware Items (${order.items.length})`,
              value: itemsPreview || 'Item details on file',
              inline: false,
            },
            {
              name: '💰 Total Order Amount',
              value: `**${totalFormatted}** *(Includes UAE 5% VAT)*`,
              inline: false,
            },
            {
              name: '⚡ Executive HITL Sign-Off',
              value: `[🖥️ **Review & Sign-Off in Admin Command Center**](${dashboardUrl})`,
              inline: false,
            },
          ],
          footer: {
            text: 'NexTech Systems Enterprise • Human-in-the-Loop Order Gateway',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (webhookUrl && webhookUrl.startsWith('http')) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });
      console.log('[NotificationService] Discord embed dispatched for Order #%s', String(order.orderNumber).replace(/\n|\r/g, ''));
    } else {
      console.log('[NotificationService: ChatOps Discord Mock] Webhook not configured in env.');
    }
  }

  /**
   * Channel 2: Telegram Bot with Inline Keyboard Callbacks
   */
  private async sendTelegramNotification(
    order: Order,
    dashboardUrl: string
  ): Promise<void> {
    const botToken = ENV.TELEGRAM_BOT_TOKEN;
    const chatId = ENV.TELEGRAM_CHAT_ID;

    const totalFormatted = `${order.currency} ${(order.total || 0).toLocaleString()}`;
    const itemsPreview = order.items
      .map(it => `• <b>${it.quantity}x</b> ${it.productName}`)
      .slice(0, 4)
      .join('\n');

    const text = `🚨 <b>NEW ORDER PENDING APPROVAL</b>\n\n` +
      `<b>Order Ref:</b> <code>#${order.orderNumber}</code>\n` +
      `<b>Customer:</b> ${order.customerName} (${order.customerEmail})\n` +
      `<b>Total Amount:</b> <b>${totalFormatted}</b>\n` +
      `<b>Payment:</b> ${order.paymentMethod} (${order.paymentStatus})\n` +
      `<b>Destination:</b> ${order.shippingAddress?.city || 'Dubai'}, UAE\n\n` +
      `<b>Hardware Items:</b>\n${itemsPreview}\n\n` +
      `<i>Status: Pending Admin Approval. Click below to review and approve/reject in Admin Command Center:</i>`;

    if (botToken && chatId) {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🖥️ Review & Sign-Off in Admin Command Center', url: dashboardUrl },
              ],
            ],
          },
        }),
      });
      console.log('[NotificationService] Telegram message dispatched for Order #%s', String(order.orderNumber).replace(/\n|\r/g, ''));
    } else {
      console.log('[NotificationService: ChatOps Telegram Mock] Telegram bot token not configured.');
    }
  }

  /**
   * Channel 3: Transactional Admin Email Alert
   */
  private async sendAdminEmailAlert(
    order: Order,
    dashboardUrl: string
  ): Promise<void> {
    const adminEmail = ENV.ADMIN_NOTIFICATION_EMAIL || ENV.ADMIN_DEFAULT_EMAIL;
    const safeAdminEmail = String(adminEmail).replace(/\n|\r/g, '');
    const safeOrderNum = String(order.orderNumber).replace(/\n|\r/g, '');
    console.log(
      `[NotificationService: Email Dispatch] Dispatched to admin [${safeAdminEmail}] for Order #${safeOrderNum} ` +
      `(Dashboard: ${dashboardUrl})`
    );
  }

  /**
   * Retrieves active, synchronized notifications across the entire ERP/Storefront system
   */
  async getAdminNotifications(): Promise<AdminNotificationsResponse> {
    // 1. Fetch read records
    let readRecords: Array<{ id: string; readAt: string }> = [];
    try {
      readRecords = await dbStore.find<{ id: string; readAt: string }>('admin_notifications_read');
    } catch {
      readRecords = [];
    }
    const readIds = new Set(readRecords.map(r => r.id));

    const notifications: AdminNotification[] = [];

    // 2. Scan Orders for actionable items
    try {
      const orders = await orderRepository.find({ orderBy: { field: 'createdAt', direction: 'desc' }, limit: 100 });
      for (const order of orders) {
        // A. Orders pending admin approval
        if (order.orderStatus === 'PENDING_APPROVAL') {
          const id = `order_approval_${order.id}`;
          notifications.push({
            id,
            type: 'ORDER_PENDING_APPROVAL',
            title: `Order #${order.orderNumber} Awaits Approval`,
            message: `${order.customerName} placed order for ${order.currency || 'AED'} ${(order.total || 0).toLocaleString()} requiring verification.`,
            category: 'ORDERS',
            severity: 'CRITICAL',
            actionRequired: true,
            actionUrl: `/admin/orders?orderId=${order.id}`,
            actionLabel: 'Review Order',
            isRead: readIds.has(id),
            createdAt: order.statusHistory?.[0]?.timestamp || new Date().toISOString(),
            metadata: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
          });
        }

        // B. In-Store Payment pickup orders awaiting showroom collection
        if (order.paymentMethod === 'IN_STORE' && (order.paymentStatus === 'PENDING' || order.orderStatus === 'PENDING')) {
          const id = `order_instore_${order.id}`;
          notifications.push({
            id,
            type: 'ORDER_INSTORE_PENDING',
            title: `In-Store Payment: #${order.orderNumber}`,
            message: `Showroom pickup reservation awaiting customer payment (${order.currency || 'AED'} ${(order.total || 0).toLocaleString()}).`,
            category: 'ORDERS',
            severity: 'WARNING',
            actionRequired: true,
            actionUrl: `/admin/orders?orderId=${order.id}`,
            actionLabel: 'View Showroom Order',
            isRead: readIds.has(id),
            createdAt: order.statusHistory?.[0]?.timestamp || new Date().toISOString(),
            metadata: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
          });
        }

        // C. COD orders ready for dispatch
        if (order.paymentMethod === 'COD' && (order.orderStatus === 'PROCESSING' || order.orderStatus === 'PENDING')) {
          const id = `order_cod_${order.id}`;
          notifications.push({
            id,
            type: 'ORDER_COD_DISPATCH',
            title: `COD Order #${order.orderNumber} Ready to Dispatch`,
            message: `Cash on Delivery order for ${order.customerName} (${order.shippingAddress?.city || 'UAE'}) ready for courier handover.`,
            category: 'ORDERS',
            severity: 'WARNING',
            actionRequired: true,
            actionUrl: `/admin/orders?orderId=${order.id}`,
            actionLabel: 'Dispatch Order',
            isRead: readIds.has(id),
            createdAt: order.statusHistory?.[0]?.timestamp || new Date().toISOString(),
            metadata: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Error querying orders for notifications:', err);
    }

    // 3. Scan Inventory for Low Stock and Out of Stock
    try {
      const products = await productRepository.find({ limit: 300 });
      for (const prod of products) {
        if (!prod.isActive) continue;

        if (prod.stock === 0) {
          const id = `stock_out_${prod.id}`;
          notifications.push({
            id,
            type: 'PRODUCT_OUT_OF_STOCK',
            title: `Out of Stock: ${prod.name}`,
            message: `SKU ${prod.sku} stock is depleted (0 units). Reorder via Purchase Order immediately.`,
            category: 'INVENTORY',
            severity: 'CRITICAL',
            actionRequired: true,
            actionUrl: `/admin/purchase-orders`,
            actionLabel: 'Generate PO',
            isRead: readIds.has(id),
            createdAt: prod.updatedAt || prod.createdAt || new Date().toISOString(),
            metadata: { productId: prod.id, sku: prod.sku, stock: 0 },
          });
        } else if (prod.stock > 0 && prod.stock <= 5) {
          const id = `stock_low_${prod.id}`;
          notifications.push({
            id,
            type: 'PRODUCT_LOW_STOCK',
            title: `Low Stock Alert: ${prod.name}`,
            message: `SKU ${prod.sku} has only ${prod.stock} unit(s) remaining in warehouse.`,
            category: 'INVENTORY',
            severity: 'WARNING',
            actionRequired: true,
            actionUrl: `/admin/purchase-orders`,
            actionLabel: 'Restock Item',
            isRead: readIds.has(id),
            createdAt: prod.updatedAt || prod.createdAt || new Date().toISOString(),
            metadata: { productId: prod.id, sku: prod.sku, stock: prod.stock },
          });
        }

        // Reseller product listing approval pending
        if (prod.approvalStatus === 'PENDING_APPROVAL') {
          const id = `prod_approval_${prod.id}`;
          notifications.push({
            id,
            type: 'PRODUCT_APPROVAL_PENDING',
            title: `Listing Awaiting Review: ${prod.name}`,
            message: `Reseller product submitted for catalog listing approval (SKU ${prod.sku}).`,
            category: 'PRODUCTS',
            severity: 'CRITICAL',
            actionRequired: true,
            actionUrl: `/admin/products`,
            actionLabel: 'Review Listing',
            isRead: readIds.has(id),
            createdAt: prod.createdAt || new Date().toISOString(),
            metadata: { productId: prod.id, sku: prod.sku, resellerId: prod.resellerId },
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Error querying products for notifications:', err);
    }

    // 4. Scan Resellers for pending partner vetting
    try {
      const resellers = await resellerRepository.find({ limit: 100 });
      for (const res of resellers) {
        if (res.status === 'PENDING_APPROVAL') {
          const id = `reseller_pending_${res.id}`;
          notifications.push({
            id,
            type: 'RESELLER_PENDING_APPROVAL',
            title: `Partner Application: ${res.businessName || res.displayName}`,
            message: `New reseller application from ${res.email} (${res.resellerCode}) awaiting vetting.`,
            category: 'RESELLERS',
            severity: 'CRITICAL',
            actionRequired: true,
            actionUrl: `/admin/resellers`,
            actionLabel: 'Vet Partner',
            isRead: readIds.has(id),
            createdAt: res.createdAt || new Date().toISOString(),
            metadata: { resellerId: res.id, email: res.email, code: res.resellerCode },
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Error querying resellers for notifications:', err);
    }

    // 5. Scan B2B Quotes for pending quotation RFQs
    try {
      const quotes = await quoteRepository.findRecent(50);
      for (const q of quotes) {
        if (q.status === 'PENDING_REVIEW' || (q.status as any) === 'DRAFT') {
          const id = `quote_pending_${q.id}`;
          notifications.push({
            id,
            type: 'QUOTE_PENDING_REVIEW',
            title: `B2B RFQ Quote #${q.quoteNumber || q.id}`,
            message: `Enterprise quote request from ${q.companyName || q.contactName || q.contactEmail} awaiting pricing & terms.`,
            category: 'QUOTES',
            severity: 'WARNING',
            actionRequired: true,
            actionUrl: `/admin/quotes`,
            actionLabel: 'Review RFQ',
            isRead: readIds.has(id),
            createdAt: q.createdAt || new Date().toISOString(),
            metadata: { quoteId: q.id, quoteNumber: q.quoteNumber },
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Error querying quotes for notifications:', err);
    }

    // 6. Add persistent in-app notifications
    try {
      const persisted = await dbStore.find<any>('admin_notifications');
      for (const p of persisted) {
        const id = p.id;
        // Avoid duplicate if synthesized above
        if (notifications.some(n => n.id === id)) continue;

        notifications.push({
          id,
          type: p.type || 'SYSTEM_ALERT',
          title: p.title || (p.type === 'ORDER_PENDING_APPROVAL' ? `Order #${p.orderNumber} Verification` : 'System Notification'),
          message: p.message || `Notification regarding ${p.orderNumber || 'system'}`,
          category: p.category || (p.orderId ? 'ORDERS' : 'SYSTEM'),
          severity: p.severity || (p.type === 'ORDER_PENDING_APPROVAL' ? 'CRITICAL' : 'INFO'),
          actionRequired: p.actionRequired !== undefined ? p.actionRequired : (p.type === 'ORDER_PENDING_APPROVAL'),
          actionUrl: p.actionUrl || (p.orderId ? `/admin/orders?orderId=${p.orderId}` : '/admin'),
          actionLabel: p.actionLabel || (p.orderId ? 'View Order' : 'Open'),
          isRead: Boolean(p.isRead) || readIds.has(id),
          createdAt: p.createdAt || new Date().toISOString(),
          metadata: p.metadata || { orderId: p.orderId, orderNumber: p.orderNumber },
        });
      }
    } catch (err) {
      console.warn('[NotificationService] Error querying persistent notifications:', err);
    }

    // Sort by createdAt descending
    const sorted = notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = sorted.filter(n => !n.isRead).length;
    const actionRequiredCount = sorted.filter(n => n.actionRequired && !n.isRead).length;
    const criticalCount = sorted.filter(n => n.severity === 'CRITICAL' && !n.isRead).length;

    return {
      notifications: sorted,
      unreadCount,
      actionRequiredCount,
      criticalCount,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  /**
   * Marks a specific notification as read
   */
  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      // 1. If present in persistent notifications table, mark read
      try {
        await dbStore.update('admin_notifications', id, { isRead: true });
      } catch {
        // Ignore if synthesized
      }

      // 2. Add to read tracking collection
      const existing = await dbStore.findById<{ id: string }>('admin_notifications_read', id);
      if (!existing) {
        await dbStore.create('admin_notifications_read', {
          id,
          readAt: new Date().toISOString(),
        });
      }
      return true;
    } catch (err) {
      console.error('[NotificationService] Failed to mark notification read:', err);
      return false;
    }
  }

  /**
   * Marks all active notifications as read
   */
  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      const { notifications } = await this.getAdminNotifications();
      const now = new Date().toISOString();

      for (const n of notifications) {
        if (!n.isRead) {
          try {
            await dbStore.create('admin_notifications_read', {
              id: n.id,
              readAt: now,
            });
          } catch {
            // Already read or error
          }
        }
      }

      // Also bulk update persistent notifications
      const persisted = await dbStore.find<any>('admin_notifications');
      for (const p of persisted) {
        if (!p.isRead) {
          try {
            await dbStore.update('admin_notifications', p.id, { isRead: true });
          } catch {
            // ignore
          }
        }
      }

      return true;
    } catch (err) {
      console.error('[NotificationService] Failed to mark all notifications read:', err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
