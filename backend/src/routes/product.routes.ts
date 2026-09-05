import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';

const router = Router();

router.get('/', (req, res, next) => productController.getProducts(req, res).catch(next));
router.get('/categories', (req, res, next) => productController.getCategories(req, res).catch(next));
router.get('/brands', (req, res, next) => productController.getBrands(req, res).catch(next));
router.get('/config', (req, res, next) => productController.getStoreConfig(req, res).catch(next));
router.get('/:slug', (req, res, next) => productController.getProductBySlug(req, res).catch(next));

export default router;
