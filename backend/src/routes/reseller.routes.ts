import { Router } from 'express';
import multer from 'multer';
import { resellerController } from '../controllers/reseller.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireResellerTenant } from '../middleware/rbac.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const router = Router();

// Publicly downloadable listing template
router.get('/template/download', (req, res, next) => resellerController.downloadTemplate(req, res).catch(next));

// Reseller routes require authentication and RESELLER role (or ADMIN)
router.use(authenticate, requireRole('RESELLER', 'ADMIN'), requireResellerTenant);

// Dashboard & Profile
router.get('/dashboard', (req, res, next) => resellerController.getDashboard(req, res).catch(next));
router.get('/profile', (req, res, next) => resellerController.getProfile(req, res).catch(next));
router.put('/profile', (req, res, next) => resellerController.updateProfile(req, res).catch(next));

// Products
router.get('/products', (req, res, next) => resellerController.getProducts(req, res).catch(next));
router.post('/products', (req, res, next) => resellerController.createProduct(req, res).catch(next));
router.put('/products/:id', (req, res, next) => resellerController.updateProduct(req, res).catch(next));
router.delete('/products/:id', (req, res, next) => resellerController.deleteProduct(req, res).catch(next));
router.patch('/products/:id/inventory', (req, res, next) => resellerController.updateInventory(req, res).catch(next));

// Orders
router.get('/orders', (req, res, next) => resellerController.getOrders(req, res).catch(next));

// Excel Product Importer
router.post('/import/preview', upload.single('file'), (req, res, next) => resellerController.previewImport(req, res).catch(next));
router.post('/import/execute', (req, res, next) => resellerController.executeImport(req, res).catch(next));
router.get('/import/history', (req, res, next) => resellerController.getImportHistory(req, res).catch(next));

export default router;
