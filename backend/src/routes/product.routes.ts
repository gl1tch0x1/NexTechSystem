import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { apiLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Apply rate limiter
router.use(apiLimiter);

router.get('/', (req, res, next) => productController.getProducts(req, res).catch(next));
router.get('/categories', (req, res, next) => productController.getCategories(req, res).catch(next));
router.get('/brands', (req, res, next) => productController.getBrands(req, res).catch(next));
router.get('/config', (req, res, next) => productController.getStoreConfig(req, res).catch(next));
router.get('/:slug', (req, res, next) => productController.getProductBySlug(req, res).catch(next));

export default router;

