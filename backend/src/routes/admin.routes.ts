import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Require ADMIN role for all routes in this router
router.use(authenticate, requireRole('ADMIN'));

// 1. Dashboard & Real-Time Analytics
router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res).catch(next));
router.get('/analytics', (req, res, next) => adminController.getAnalytics(req, res).catch(next));


// 2. Products & Approvals
router.get('/products', (req, res, next) => adminController.getProducts(req, res).catch(next));
router.post('/products', (req, res, next) => adminController.createProduct(req, res).catch(next));
router.put('/products/:id', (req, res, next) => adminController.updateProduct(req, res).catch(next));
router.delete('/products/:id', (req, res, next) => adminController.deleteProduct(req, res).catch(next));
router.put('/products/:id/approval', (req, res, next) => adminController.setProductApproval(req, res).catch(next));

// 3. Resellers
router.get('/resellers', (req, res, next) => adminController.getResellers(req, res).catch(next));
router.get('/resellers/:id', (req, res, next) => adminController.getResellerById(req, res).catch(next));
router.post('/resellers', (req, res, next) => adminController.createReseller(req, res).catch(next));
router.put('/resellers/:id', (req, res, next) => adminController.updateReseller(req, res).catch(next));
router.put('/resellers/:id/status', (req, res, next) => adminController.updateResellerStatus(req, res).catch(next));
router.delete('/resellers/:id', (req, res, next) => adminController.deleteReseller(req, res).catch(next));

// 4. Customers & Wallets
router.get('/customers', (req, res, next) => adminController.getCustomers(req, res).catch(next));
router.put('/customers/:id/toggle-status', (req, res, next) => adminController.toggleCustomerStatus(req, res).catch(next));
router.post('/customers/:id/wallet-adjust', (req, res, next) => adminController.adjustCustomerWallet(req, res).catch(next));

// 5. Orders
router.get('/orders', (req, res, next) => adminController.getOrders(req, res).catch(next));
router.put('/orders/:id/status', (req, res, next) => adminController.updateOrderStatus(req, res).catch(next));

// 6. Categories CRUD
router.get('/categories', (req, res, next) => adminController.getCategories(req, res).catch(next));
router.post('/categories', (req, res, next) => adminController.createCategory(req, res).catch(next));
router.put('/categories/:id', (req, res, next) => adminController.updateCategory(req, res).catch(next));
router.delete('/categories/:id', (req, res, next) => adminController.deleteCategory(req, res).catch(next));

// 7. Brands CRUD
router.get('/brands', (req, res, next) => adminController.getBrands(req, res).catch(next));
router.post('/brands', (req, res, next) => adminController.createBrand(req, res).catch(next));
router.put('/brands/:id', (req, res, next) => adminController.updateBrand(req, res).catch(next));
router.delete('/brands/:id', (req, res, next) => adminController.deleteBrand(req, res).catch(next));

// 8. Coupons CRUD
router.get('/coupons', (req, res, next) => adminController.getCoupons(req, res).catch(next));
router.post('/coupons', (req, res, next) => adminController.createCoupon(req, res).catch(next));
router.put('/coupons/:id', (req, res, next) => adminController.updateCoupon(req, res).catch(next));
router.delete('/coupons/:id', (req, res, next) => adminController.deleteCoupon(req, res).catch(next));

// 9. Banners CRUD
router.get('/banners', (req, res, next) => adminController.getBanners(req, res).catch(next));
router.post('/banners', (req, res, next) => adminController.createBanner(req, res).catch(next));
router.put('/banners/:id', (req, res, next) => adminController.updateBanner(req, res).catch(next));
router.delete('/banners/:id', (req, res, next) => adminController.deleteBanner(req, res).catch(next));

// 10. Settings & Audit
router.get('/settings', (req, res, next) => adminController.getSettings(req, res).catch(next));
router.put('/settings', (req, res, next) => adminController.updateSettings(req, res).catch(next));
router.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res).catch(next));

export default router;
