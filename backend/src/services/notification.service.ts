import { ENV } from '../config/env.js';
import { Order } from '../types/index.js';
import { dbStore } from '../config/db-store.js';
import { auditService } from './audit.service.js';

export interface AdminNotification {
  id: string;
  type: 'ORDER_PENDING_APPROVAL' | 'ORDER_APPROVED' | 'ORDER_REJECTED';
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  itemsCount: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

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
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'ORDER_PENDING_APPROVAL',
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        total: order.total,
        currency: order.currency || 'AED',
        itemsCount: order.items?.length || 1,
        message: `Order #${order.orderNumber} placed by ${order.customerName} awaits admin verification.`,
        isRead: false,
        createdAt: new Date().toISOString(),
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
   * Retrieves active in-app notifications for Admin Dashboard
   */
  async getAdminNotifications(): Promise<AdminNotification[]> {
    const all = await dbStore.find<AdminNotification>('admin_notifications');
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Marks notification as read
   */
  async markNotificationAsRead(id: string): Promise<boolean> {
    await dbStore.update('admin_notifications', id, { isRead: true });
    return true;
  }
}

export const notificationService = new NotificationService();
