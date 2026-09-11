import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { analyticsService } from '../services/analytics.service.js';
import { productService } from '../services/product.service.js';
import { resellerService } from '../services/reseller.service.js';
import { orderService } from '../services/order.service.js';
import { walletService } from '../services/wallet.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { bannerRepository } from '../repositories/banner.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { purchaseOrderRepository } from '../repositories/purchase-order.repository.js';
import { bentoFeatureRepo } from '../repositories/content.repository.js';
import { dbStore } from '../config/db-store.js';
import { auditService } from '../services/audit.service.js';
import { ENV } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';
import { PurchaseOrder, POLineItem, StorefrontSectionConfig, BentoFeature, Address } from '../types/index.js';

export class AdminController {
  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const metrics = await analyticsService.getAdminDashboardMetrics();
    res.json({ success: true, data: metrics });
  }

  async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const range = (req.query.range as string) || '30d';
    const analytics = await analyticsService.getAdvancedAnalytics(range);
    res.json({ success: true, data: analytics });
  }


  // ==========================================
  // 1. PRODUCT MANAGEMENT CRUD
  // ==========================================
  async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { status, search, page, limit, categoryId, brandId } = req.query;
    const result = await productService.getProducts({
      approvalStatus: status as any,
      search: search as string,
      categoryId: categoryId as string,
      brandId: brandId as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 100,
    });
    res.json({ success: true, data: result.products, meta: result });
  }

  async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sellerType = req.body.sellerType || (req.body.resellerId ? 'RESELLER' : 'ADMIN');
    const prod = await productService.createProduct({
      ...req.body,
      sellerType,
      approvalStatus: req.body.approvalStatus || 'APPROVED',
      isActive: req.body.isActive !== false,
    });
    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'ADMIN_PRODUCT_CREATED',
      resource: 'product',
      resourceId: prod.id,
      details: { title: prod.name, sku: prod.sku, price: prod.price },
    });
    res.status(201).json({ success: true, data: prod });
  }

  async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const updated = await productService.updateProduct(id, req.body);
    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'ADMIN_PRODUCT_UPDATED',
      resource: 'product',
      resourceId: id,
      details: req.body,
    });
    res.json({ success: true, data: updated });
  }

  async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    await productService.deleteProduct(id);
    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'ADMIN_PRODUCT_DELETED',
      resource: 'product',
      resourceId: id,
    });
    res.json({ success: true, message: 'Product deleted successfully.' });
  }

  async setProductApproval(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;
    const updated = await productService.setApprovalStatus(id, status, rejectionReason, req.user?.id);
    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: `ADMIN_PRODUCT_${status}`,
      resource: 'product',
      resourceId: id,
      details: { status, rejectionReason },
    });
    res.json({ success: true, data: updated });
  }

  // ==========================================
  // 2. RESELLER PARTNERS CRUD
  // ==========================================
  async getResellers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const resellers = await resellerService.getAllResellers();
    res.json({ success: true, data: resellers });
  }

  async getResellerById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const reseller = await resellerService.getResellerById(id);
    if (!reseller) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Reseller not found.' } });
      return;
    }
    const products = await productService.getProducts({ resellerId: id, limit: 100 });
    const orders = await orderService.getOrdersByReseller(id);
    res.json({
      success: true,
      data: {
        reseller,
        products: products.products,
        orders,
      },
    });
  }

  async createReseller(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await resellerService.createReseller(req.body, req.user?.id || 'admin');
      await auditService.log({
        userId: req.user?.id || 'admin',
        userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
        userRole: 'ADMIN',
        action: 'ADMIN_RESELLER_PROVISIONED',
        resource: 'reseller',
        resourceId: result.reseller.id,
        details: { businessName: req.body.businessName, resellerCode: req.body.resellerCode },
      });
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'RESELLER_CREATION_FAILED', message: err.message } });
    }
  }

  async updateReseller(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const updated = await resellerService.updateResellerProfile(id, req.body);
    res.json({ success: true, data: updated });
  }

  async updateResellerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status } = req.body;
    const updated = await resellerService.updateResellerStatus(id, status, req.user?.id || 'admin');
    res.json({ success: true, data: updated });
  }

  async deleteReseller(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    await resellerService.updateResellerStatus(id, 'SUSPENDED', req.user?.id || 'admin');
    res.json({ success: true, message: 'Reseller account suspended successfully.' });
  }

  // ==========================================
  // 3. CUSTOMER ACCOUNTS & WALLET CONTROL
  // ==========================================
  async getCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const allUsers = await userRepository.find({ where: [{ field: 'role', operator: '==', value: 'CUSTOMER' }] });
    // Fetch wallet balances for each customer
    const customersWithWallets = await Promise.all(
      allUsers.map(async (u) => {
        const wallet = await walletService.getOrCreateWallet(u.id);
        const orders = await orderService.getOrdersByUser(u.id);
        return {
          ...u,
          walletBalance: wallet.balance,
          orderCount: orders.length,
          totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
        };
      })
    );
    res.json({ success: true, data: customersWithWallets });
  }

  async toggleCustomerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const user = await userRepository.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
      return;
    }
    const updated = await userRepository.update(id, { isActive: !user.isActive });
    res.json({ success: true, data: updated });
  }

  async adjustCustomerWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { amount, type, reason } = req.body;

    const user = await userRepository.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
      return;
    }

    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0 || num > 1000000) {
      res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number up to 1,000,000 AED.' } });
      return;
    }
    const cleanAmount = Math.round(num * 100) / 100;

    let result;
    if (type === 'DEBIT') {
      result = await walletService.debitWallet({
        userId: id,
        amount: cleanAmount,
        reason: reason || 'Administrative Debit Adjustment',
        referenceId: `admin_adj_${uuidv4().substring(0, 8)}`,
      });
    } else {
      result = await walletService.creditWallet({
        userId: id,
        amount: cleanAmount,
        reason: reason || 'Administrative Credit Adjustment',
        referenceId: `admin_adj_${uuidv4().substring(0, 8)}`,
        type: 'CREDIT',
      });
    }

    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'ADMIN_WALLET_ADJUSTED',
      resource: 'wallet',
      resourceId: user.id,
      details: { amount, type, reason, newBalance: result.wallet.balance },
    });

    res.json({ success: true, data: result });
  }

  // ==========================================
  // 4. ORDER MANAGEMENT
  // ==========================================
  async getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orders = await orderService.getAllOrders();
    res.json({ success: true, data: orders });
  }

  async updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status, note } = req.body;
    const updated = await orderService.updateOrderStatus(id, status, note, req.user?.id);
    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'ADMIN_ORDER_STATUS_UPDATED',
      resource: 'order',
      resourceId: id,
      details: { newStatus: status, note },
    });
    res.json({ success: true, data: updated });
  }

  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentStatus,
      orderStatus,
      couponCode,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: { message: 'At least one order item is required.' } });
      return;
    }

    // Resolve customer details from database or request payload
    let userId = customerId || req.user?.id || 'guest_admin_order';
    let resolvedName = customerName || 'Enterprise Direct Client';
    let resolvedEmail = customerEmail || 'orders@nextechsystems.com';
    let resolvedPhone = customerPhone || '+971 4 800 TECH';

    if (customerId) {
      const customer = await userRepository.findById(customerId);
      if (customer) {
        resolvedName = customerName || customer.name;
        resolvedEmail = customerEmail || customer.email;
        resolvedPhone = customerPhone || customer.phone || resolvedPhone;
      }
    }

    const defaultAddress: Address = {
      id: 'addr_admin_default',
      fullName: resolvedName,
      phone: resolvedPhone,
      addressLine1: shippingAddress?.addressLine1 || 'Sheikh Zayed Road, Business Bay Tower',
      city: shippingAddress?.city || 'Dubai',
      state: shippingAddress?.state || 'Dubai',
      country: shippingAddress?.country || 'AE',
      postalCode: shippingAddress?.postalCode || '00000',
      isDefault: false,
    };

    const order = await orderService.createOrder({
      userId,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      customerPhone: resolvedPhone,
      items,
      shippingAddress: shippingAddress || defaultAddress,
      billingAddress: billingAddress || shippingAddress || defaultAddress,
      paymentMethod: paymentMethod || 'CREDIT_CARD',
      couponCode,
      notes: notes || 'Admin Direct Sales Order',
    });

    // If admin specified a custom payment or fulfillment status upfront, update it
    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      await orderRepository.update(order.id, { paymentStatus });
      order.paymentStatus = paymentStatus;
    }
    if (orderStatus && orderStatus !== order.orderStatus) {
      await orderService.updateOrderStatus(order.id, orderStatus, 'Admin Direct Status Override', req.user?.id);
      order.orderStatus = orderStatus;
    }

    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'ADMIN_SALES_ORDER_CREATED',
      resource: 'order',
      resourceId: order.id,
      details: {
        orderNumber: order.orderNumber,
        customerName: resolvedName,
        total: order.total,
        itemCount: order.items.length,
      },
    });

    res.status(201).json({ success: true, data: order });
  }

  // ==========================================
  // 5. CATEGORIES CRUD
  // ==========================================
  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    const categories = await categoryRepository.find();
    res.json({ success: true, data: categories });
  }

  async createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Category name is required.' } });
      return;
    }
    const cleanName = name.trim();
    const slug = req.body.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const cat = await categoryRepository.create({
      ...req.body,
      name: cleanName,
      slug,
      id: req.body.id || `cat_${uuidv4()}`,
      productCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true, data: cat });
  }

  async updateCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const updated = await categoryRepository.update(id, req.body);
    res.json({ success: true, data: updated });
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    await categoryRepository.delete(id);
    res.json({ success: true, message: 'Category deleted successfully.' });
  }

  // ==========================================
  // 6. BRANDS CRUD
  // ==========================================
  async getBrands(req: AuthenticatedRequest, res: Response): Promise<void> {
    const brands = await brandRepository.find();
    res.json({ success: true, data: brands });
  }

  async createBrand(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Brand name is required.' } });
      return;
    }
    const cleanName = name.trim();
    const slug = req.body.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const brand = await brandRepository.create({
      ...req.body,
      name: cleanName,
      slug,
      id: req.body.id || `brand_${uuidv4()}`,
      productCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true, data: brand });
  }

  async updateBrand(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const updated = await brandRepository.update(id, req.body);
    res.json({ success: true, data: updated });
  }

  async deleteBrand(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    await brandRepository.delete(id);
    res.json({ success: true, message: 'Brand deleted successfully.' });
  }

  // ==========================================
  // 7. COUPONS CRUD
  // ==========================================
  async getCoupons(req: AuthenticatedRequest, res: Response): Promise<void> {
    const coupons = await couponRepository.find();
    res.json({ success: true, data: coupons });
  }

  async createCoupon(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { code, discountType, discountValue } = req.body;
    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Coupon code is required.' } });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await couponRepository.create({
      ...req.body,
      id: `coupon_${uuidv4()}`,
      code: cleanCode,
      discountType: discountType || 'PERCENTAGE',
      discountValue: discountValue != null ? Number(discountValue) : 10,
      usageCount: 0,
      isActive: req.body.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true, data: coupon });
  }

  async updateCoupon(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const updated = await couponRepository.update(id, {
      ...req.body,
      code: req.body.code ? req.body.code.toUpperCase() : undefined,
    });
    res.json({ success: true, data: updated });
  }

  async deleteCoupon(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    await couponRepository.delete(id);
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  }

  // ==========================================
  // 8. BANNERS CRUD
  // ==========================================
  async getBanners(req: AuthenticatedRequest, res: Response): Promise<void> {
    const banners = await bannerRepository.find();
    res.json({ success: true, data: banners });
  }

  async createBanner(req: AuthenticatedRequest, res: Response): Promise<void> {
    const banner = await bannerRepository.create({
      ...req.body,
      id: `banner_${uuidv4()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true, data: banner });
  }

  async updateBanner(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const updated = await bannerRepository.update(id, req.body);
    res.json({ success: true, data: updated });
  }

  async deleteBanner(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    await bannerRepository.delete(id);
    res.json({ success: true, message: 'Banner deleted successfully.' });
  }

  // ==========================================
  // 9. SETTINGS & AUDIT LOGS
  // ==========================================
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const settings = await settingsRepository.getSettings();
    res.json({ success: true, data: settings });
  }

  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const updated = await settingsRepository.update('global_settings', req.body);
    res.json({ success: true, data: updated });
  }

  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const logs = await auditService.getRecentLogs(150);
    res.json({ success: true, data: logs });
  }

  async getAdminProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const adminUser = req.user?.id ? await userRepository.findById(req.user.id) : null;
    res.json({
      success: true,
      data: {
        id: adminUser?.id || req.user?.id || 'admin',
        email: adminUser?.email || req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
        name: adminUser ? adminUser.name : 'System Administrator',
        role: adminUser?.role || 'ADMIN',
      },
    });
  }

  // ==========================================
  // 10. DATABASE BACKUP & DISASTER RECOVERY
  // ==========================================
  async createBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const snapshot = dbStore.exportAll();
    await auditService.log({
      action: 'CREATE',
      resource: 'DATABASE_BACKUP',
      resourceId: snapshot.id,
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      details: {
        filename: snapshot.filename,
        collectionCount: snapshot.collectionCount,
        totalRecords: snapshot.totalRecords,
        sizeBytes: snapshot.sizeBytes,
      },
    });
    res.json({ success: true, data: snapshot });
  }

  async restoreBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const snapshotData = req.body;
    if (!snapshotData) {
      res.status(400).json({ success: false, error: { message: 'Snapshot payload is required for restoration.' } });
      return;
    }
    const result = await dbStore.importAll(snapshotData);
    await auditService.log({
      action: 'UPDATE',
      resource: 'DATABASE_RESTORE',
      resourceId: snapshotData.id || 'snapshot_import',
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      details: {
        restoredCollections: result.restoredCollections,
        totalRecords: result.totalRecords,
      },
    });
    res.json({ success: true, message: 'Database restored successfully from snapshot.', data: result });
  }

  // ==========================================
  // 11. PURCHASE ORDERS & AUTOMATED RESTOCK
  // ==========================================
  async getPurchaseOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orders = await purchaseOrderRepository.findRecent(100);
    res.json({ success: true, data: orders });
  }

  async generateLowStockPO(req: AuthenticatedRequest, res: Response): Promise<void> {
    const allProducts = await productRepository.find();
    // Filter products whose current stock is at or below their lowStockThreshold
    const lowStockItems = allProducts.filter(p => {
      const threshold = p.lowStockThreshold || 5;
      return p.stock <= threshold;
    });

    if (lowStockItems.length === 0) {
      res.json({
        success: true,
        message: 'All inventory levels are optimal. No products currently require restock.',
        data: null,
      });
      return;
    }

    const items: POLineItem[] = lowStockItems.map(p => {
      const threshold = p.lowStockThreshold || 5;
      const suggestedQty = Math.max(15, threshold * 3 - p.stock);
      const cost = p.costPrice || Math.round(p.price * 0.75);
      return {
        productId: p.id,
        sku: p.sku,
        title: p.name,
        categoryName: p.categoryName,
        brandName: p.brandName,
        currentStock: p.stock,
        lowStockThreshold: threshold,
        suggestedReorderQuantity: suggestedQty,
        orderedQuantity: suggestedQty,
        unitCost: cost,
        totalCost: cost * suggestedQty,
        supplierName: p.sellerType === 'RESELLER' && p.resellerName ? p.resellerName : `${p.brandName || 'Direct'} Authorized Distributor`,
      };
    });

    const totalUnits = items.reduce((sum, item) => sum + item.orderedQuantity, 0);
    const totalEstimatedCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPO: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber,
      status: 'DRAFT',
      items,
      totalUnits,
      totalEstimatedCost,
      currency: 'AED',
      targetWarehouse: req.body?.targetWarehouse || 'loc_dxb_main',
      supplierName: req.body?.supplierName || 'GCC Master Hardware Consortium',
      notes: req.body?.notes || 'Automated low-stock threshold trigger restock batch.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await purchaseOrderRepository.create(newPO);

    await auditService.log({
      action: 'CREATE',
      resource: 'PURCHASE_ORDER',
      resourceId: created.id,
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      details: {
        poNumber: created.poNumber,
        itemCount: items.length,
        totalUnits,
        totalEstimatedCost,
      },
    });

    res.json({ success: true, data: created });
  }

  async updatePOStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status, receivedNotes } = req.body;

    const existing = await purchaseOrderRepository.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: { message: 'Purchase Order not found.' } });
      return;
    }

    const updates: Partial<PurchaseOrder> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'ISSUED' && !existing.issuedAt) {
      updates.issuedAt = new Date().toISOString();
    }

    if (status === 'RECEIVED' && !existing.receivedAt) {
      updates.receivedAt = new Date().toISOString();
      // Automatically increment product stock for all items in the received PO
      for (const item of existing.items) {
        try {
          const prod = await productRepository.findById(item.productId);
          if (prod) {
            const newStock = prod.stock + item.orderedQuantity;
            await productRepository.update(item.productId, { stock: newStock });
          }
        } catch (err) {
          console.error(`Failed to increment stock for product ${item.productId}:`, err);
        }
      }
    }

    const updated = await purchaseOrderRepository.update(id, updates);
    res.json({ success: true, data: updated });
  }

  // ==========================================
  // 12. STOREFRONT CMS LAYOUT ARRANGER
  // ==========================================
  async getCmsLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const settings: any = await settingsRepository.getSettings();
    const defaultSections: StorefrontSectionConfig[] = [
      { id: 'hero', title: 'Main Hero & Visual Showcase', description: 'Enterprise hardware computing headline & direct CTAs', isVisible: true, order: 1 },
      { id: 'voucher_banner', title: 'Landing Promotional Discount Banner', description: 'Interactive discount code & margin deduction promo', isVisible: settings?.isLandingDiscountBannerActive !== false, order: 2 },
      { id: 'enterprise_bento', title: 'Enterprise Solutions Grid (Bento)', description: 'Workstation deployment, AI clusters, and rack units', isVisible: true, order: 3 },
      { id: 'catalog_matrix', title: 'Hardware Catalog & Live Filters', description: 'Featured component matrix with multi-attribute filtering', isVisible: true, order: 4 },
      { id: 'benchmarks', title: 'Hardware Benchmark & Performance Ratings', description: 'Cinebench, compute ratings & benchmark metrics', isVisible: true, order: 5 },
      { id: 'partner_stores', title: 'Authorized GCC Partner Reseller Network', description: 'ComNet, Al-Falasi, and licensed partner store highlights', isVisible: true, order: 6 },
      { id: 'testimonials', title: 'Enterprise Client Testimonials', description: 'Verified procurement testimonials from IT leaders', isVisible: true, order: 7 },
    ];

    const sections = settings?.storefrontSections && Array.isArray(settings.storefrontSections) && settings.storefrontSections.length > 0
      ? settings.storefrontSections
      : defaultSections;

    res.json({ success: true, data: sections });
  }

  async updateCmsLayout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sections: StorefrontSectionConfig[] = req.body.sections;
    if (!Array.isArray(sections)) {
      res.status(400).json({ success: false, error: { message: 'Sections array is required.' } });
      return;
    }

    const updated = await settingsRepository.update('global_settings', {
      storefrontSections: sections,
    } as any);

    await auditService.log({
      action: 'UPDATE',
      resource: 'STOREFRONT_CMS',
      resourceId: 'global_settings',
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      details: {
        totalSections: sections.length,
        visibleCount: sections.filter(s => s.isVisible).length,
      },
    });

    res.json({ success: true, data: updated });
  }

  // ==========================================
  // 13. BENTO TRUST FEATURES ("Why Tech Teams Trust NexTech")
  // ==========================================
  async getBentoFeatures(req: AuthenticatedRequest, res: Response): Promise<void> {
    const features = await bentoFeatureRepo.find({ orderBy: { field: 'order', direction: 'asc' } });
    res.json({ success: true, data: features });
  }

  async createBentoFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = req.body;
    const newFeature: BentoFeature = {
      id: data.id || `feat_${Date.now()}`,
      title: data.title || 'Enterprise Guarantee',
      subtitle: data.subtitle || 'Verified Standard',
      description: data.description || '',
      tag: data.tag || 'PROCUREMENT',
      iconName: data.iconName || 'shield',
      gridSpan: Number(data.gridSpan) || 5,
      statusBadge: data.statusBadge || 'Active',
      stats: data.stats || [],
      order: Number(data.order) || 1,
      isActive: data.isActive !== false,
    };

    const created = await bentoFeatureRepo.create(newFeature);
    await auditService.log({
      action: 'CREATE',
      resource: 'BENTO_FEATURE',
      resourceId: created.id,
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      details: { title: created.title },
    });
    res.json({ success: true, data: created });
  }

  async updateBentoFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const updates = req.body;
    const updated = await bentoFeatureRepo.update(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Feature not found.' } });
      return;
    }
    await auditService.log({
      action: 'UPDATE',
      resource: 'BENTO_FEATURE',
      resourceId: id,
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      details: { title: updated.title },
    });
    res.json({ success: true, data: updated });
  }

  async deleteBentoFeature(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    await bentoFeatureRepo.delete(id);
    await auditService.log({
      action: 'DELETE',
      resource: 'BENTO_FEATURE',
      resourceId: id,
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      details: { featureId: id },
    });
    res.json({ success: true, message: 'Feature deleted successfully.' });
  }
}

export const adminController = new AdminController();
