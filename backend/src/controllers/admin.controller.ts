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
import { auditService } from '../services/audit.service.js';
import { v4 as uuidv4 } from 'uuid';

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
    const prod = await productService.createProduct({
      ...req.body,
      sellerType: 'ADMIN',
      approvalStatus: 'APPROVED',
      isActive: true,
    });
    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@nextech.com',
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
      userEmail: req.user?.email || 'admin@nextech.com',
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
      userEmail: req.user?.email || 'admin@nextech.com',
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
      userEmail: req.user?.email || 'admin@nextech.com',
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
        userEmail: req.user?.email || 'admin@nextech.com',
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

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than 0.' } });
      return;
    }

    let result;
    if (type === 'DEBIT') {
      result = await walletService.debitWallet({
        userId: id,
        amount: Number(amount),
        reason: reason || 'Administrative Debit Adjustment',
        referenceId: `admin_adj_${uuidv4().substring(0, 8)}`,
      });
    } else {
      result = await walletService.creditWallet({
        userId: id,
        amount: Number(amount),
        reason: reason || 'Administrative Credit Adjustment',
        referenceId: `admin_adj_${uuidv4().substring(0, 8)}`,
        type: 'CREDIT',
      });
    }

    await auditService.log({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@nextech.com',
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
      userEmail: req.user?.email || 'admin@nextech.com',
      userRole: 'ADMIN',
      action: 'ADMIN_ORDER_STATUS_UPDATED',
      resource: 'order',
      resourceId: id,
      details: { newStatus: status, note },
    });
    res.json({ success: true, data: updated });
  }

  // ==========================================
  // 5. CATEGORIES CRUD
  // ==========================================
  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    const categories = await categoryRepository.find();
    res.json({ success: true, data: categories });
  }

  async createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const cat = await categoryRepository.create({
      ...req.body,
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
    const brand = await brandRepository.create({
      ...req.body,
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
    const coupon = await couponRepository.create({
      ...req.body,
      id: `coupon_${uuidv4()}`,
      code: req.body.code.toUpperCase(),
      usageCount: 0,
      isActive: true,
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
}

export const adminController = new AdminController();
