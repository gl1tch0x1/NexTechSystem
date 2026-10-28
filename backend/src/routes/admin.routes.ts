import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { adminLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Apply dedicated admin rate limiter and authentication
router.use(adminLimiter, authenticate);

// 1. Dashboard & Real-Time Analytics (Strictly ADMIN only)
router.get('/dashboard', requireRole('ADMIN'), (req, res, next) => adminController.getDashboard(req, res).catch(next));
router.get('/analytics', requireRole('ADMIN'), (req, res, next) => adminController.getAnalytics(req, res).catch(next));

// 2. Products & Approvals (Accessible by ADMIN and PRODUCT_EDITOR)
router.get('/products', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.getProducts(req, res).catch(next));
router.get('/products/:id', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.getProductById(req, res).catch(next));
router.post('/products', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.createProduct(req, res).catch(next));
router.put('/products/:id', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.updateProduct(req, res).catch(next));
router.delete('/products/:id', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.deleteProduct(req, res).catch(next));
router.put('/products/:id/approval', requireRole('ADMIN'), (req, res, next) => adminController.setProductApproval(req, res).catch(next));

// 3. Resellers (Strictly ADMIN only)
router.get('/resellers', requireRole('ADMIN'), (req, res, next) => adminController.getResellers(req, res).catch(next));
router.get('/resellers/:id', requireRole('ADMIN'), (req, res, next) => adminController.getResellerById(req, res).catch(next));
router.post('/resellers', requireRole('ADMIN'), (req, res, next) => adminController.createReseller(req, res).catch(next));
router.put('/resellers/:id', requireRole('ADMIN'), (req, res, next) => adminController.updateReseller(req, res).catch(next));
router.put('/resellers/:id/status', requireRole('ADMIN'), (req, res, next) => adminController.updateResellerStatus(req, res).catch(next));
router.delete('/resellers/:id', requireRole('ADMIN'), (req, res, next) => adminController.deleteReseller(req, res).catch(next));

// 4. Customers & Wallets (Strictly ADMIN only)
router.get('/customers', requireRole('ADMIN'), (req, res, next) => adminController.getCustomers(req, res).catch(next));
router.put('/customers/:id/toggle-status', requireRole('ADMIN'), (req, res, next) => adminController.toggleCustomerStatus(req, res).catch(next));
router.post('/customers/:id/wallet-adjust', requireRole('ADMIN'), (req, res, next) => adminController.adjustCustomerWallet(req, res).catch(next));

// 5. Orders (Sales Orders) & Human-in-the-Loop Approval (Strictly ADMIN only)
router.get('/orders', requireRole('ADMIN'), (req, res, next) => adminController.getOrders(req, res).catch(next));
router.post('/orders', requireRole('ADMIN'), (req, res, next) => adminController.createOrder(req, res).catch(next));
router.put('/orders/:id/status', requireRole('ADMIN'), (req, res, next) => adminController.updateOrderStatus(req, res).catch(next));
router.put('/orders/:id/cargo', requireRole('ADMIN'), (req, res, next) => adminController.updateOrderCargo(req, res).catch(next));
router.put('/orders/:id/approve', requireRole('ADMIN'), (req, res, next) => adminController.approveOrder(req, res).catch(next));
router.put('/orders/:id/reject', requireRole('ADMIN'), (req, res, next) => adminController.rejectOrder(req, res).catch(next));
router.get('/notifications', requireRole('ADMIN'), (req, res, next) => adminController.getNotifications(req, res).catch(next));
router.put('/notifications/read-all', requireRole('ADMIN'), (req, res, next) => adminController.markAllNotificationsAsRead(req, res).catch(next));
router.put('/notifications/:id/read', requireRole('ADMIN'), (req, res, next) => adminController.markNotificationAsRead(req, res).catch(next));
router.delete('/notifications/clear-all', requireRole('ADMIN'), (req, res, next) => adminController.clearAllNotifications(req, res).catch(next));
router.delete('/notifications/:id', requireRole('ADMIN'), (req, res, next) => adminController.clearNotification(req, res).catch(next));

// 6. Categories (Accessible by ADMIN and PRODUCT_EDITOR to tag products)
router.get('/categories', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.getCategories(req, res).catch(next));
router.post('/categories', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.createCategory(req, res).catch(next));
router.put('/categories/:id', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.updateCategory(req, res).catch(next));
router.delete('/categories/:id', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.deleteCategory(req, res).catch(next));

// 7. Brands (Accessible by ADMIN and PRODUCT_EDITOR to tag products)
router.get('/brands', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.getBrands(req, res).catch(next));
router.post('/brands', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.createBrand(req, res).catch(next));
router.put('/brands/:id', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.updateBrand(req, res).catch(next));
router.delete('/brands/:id', requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => adminController.deleteBrand(req, res).catch(next));

// 8. Coupons CRUD (Strictly ADMIN only)
router.get('/coupons', requireRole('ADMIN'), (req, res, next) => adminController.getCoupons(req, res).catch(next));
router.post('/coupons', requireRole('ADMIN'), (req, res, next) => adminController.createCoupon(req, res).catch(next));
router.put('/coupons/:id', requireRole('ADMIN'), (req, res, next) => adminController.updateCoupon(req, res).catch(next));
router.delete('/coupons/:id', requireRole('ADMIN'), (req, res, next) => adminController.deleteCoupon(req, res).catch(next));

// 9. Banners CRUD (Strictly ADMIN only)
router.get('/banners', requireRole('ADMIN'), (req, res, next) => adminController.getBanners(req, res).catch(next));
router.post('/banners', requireRole('ADMIN'), (req, res, next) => adminController.createBanner(req, res).catch(next));
router.put('/banners/:id', requireRole('ADMIN'), (req, res, next) => adminController.updateBanner(req, res).catch(next));
router.delete('/banners/:id', requireRole('ADMIN'), (req, res, next) => adminController.deleteBanner(req, res).catch(next));

// 10. Settings, Profile & Audit (Strictly ADMIN only)
router.get('/profile', requireRole('ADMIN'), (req, res, next) => adminController.getAdminProfile(req, res).catch(next));
router.put('/credentials', requireRole('ADMIN'), (req, res, next) => adminController.updateAdminCredentials(req, res).catch(next));
router.get('/settings', requireRole('ADMIN'), (req, res, next) => adminController.getSettings(req, res).catch(next));
router.put('/settings', requireRole('ADMIN'), (req, res, next) => adminController.updateSettings(req, res).catch(next));
router.get('/audit-logs', requireRole('ADMIN'), (req, res, next) => adminController.getAuditLogs(req, res).catch(next));

// 11. Database Backup & Disaster Recovery (Strictly ADMIN only)
router.get('/backup', requireRole('ADMIN'), (req, res, next) => adminController.createBackup(req, res).catch(next));
router.post('/restore', requireRole('ADMIN'), (req, res, next) => adminController.restoreBackup(req, res).catch(next));

// 12. Purchase Orders & Automated Restock (Strictly ADMIN only)
router.get('/purchase-orders', requireRole('ADMIN'), (req, res, next) => adminController.getPurchaseOrders(req, res).catch(next));
router.post('/purchase-orders', requireRole('ADMIN'), (req, res, next) => adminController.createPurchaseOrder(req, res).catch(next));
router.post('/purchase-orders/generate-low-stock', requireRole('ADMIN'), (req, res, next) => adminController.generateLowStockPO(req, res).catch(next));
router.put('/purchase-orders/:id/status', requireRole('ADMIN'), (req, res, next) => adminController.updatePOStatus(req, res).catch(next));

// 13. Storefront CMS Layout Arranger (Strictly ADMIN only)
router.get('/cms/layout', requireRole('ADMIN'), (req, res, next) => adminController.getCmsLayout(req, res).catch(next));
router.put('/cms/layout', requireRole('ADMIN'), (req, res, next) => adminController.updateCmsLayout(req, res).catch(next));

// 14. Bento Trust Features (Strictly ADMIN only)
router.get('/cms/features', requireRole('ADMIN'), (req, res, next) => adminController.getBentoFeatures(req, res).catch(next));
router.post('/cms/features', requireRole('ADMIN'), (req, res, next) => adminController.createBentoFeature(req, res).catch(next));
router.put('/cms/features/:id', requireRole('ADMIN'), (req, res, next) => adminController.updateBentoFeature(req, res).catch(next));
router.delete('/cms/features/:id', requireRole('ADMIN'), (req, res, next) => adminController.deleteBentoFeature(req, res).catch(next));

// 15. MongoDB Enterprise Database & Telemetry (Strictly ADMIN only)
router.get('/database/status', requireRole('ADMIN'), (req, res, next) => adminController.getDatabaseStatus(req, res).catch(next));
router.post('/database/sync-to-mongo', requireRole('ADMIN'), (req, res, next) => adminController.syncToMongo(req, res).catch(next));
router.post('/database/sync-from-mongo', requireRole('ADMIN'), (req, res, next) => adminController.syncFromMongo(req, res).catch(next));

// 16. Product Editors Management (Strictly ADMIN only)
router.get('/editors', requireRole('ADMIN'), (req, res, next) => adminController.getProductEditors(req, res).catch(next));
router.post('/editors', requireRole('ADMIN'), (req, res, next) => adminController.createProductEditor(req, res).catch(next));
router.put('/editors/:id/status', requireRole('ADMIN'), (req, res, next) => adminController.toggleProductEditorStatus(req, res).catch(next));
router.delete('/editors/:id', requireRole('ADMIN'), (req, res, next) => adminController.deleteProductEditor(req, res).catch(next));

export default router;
