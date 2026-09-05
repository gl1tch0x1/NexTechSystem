import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, (req, res, next) => orderController.createOrder(req, res).catch(next));
router.get('/my', authenticate, (req, res, next) => orderController.getMyOrders(req, res).catch(next));
router.get('/:id', authenticate, (req, res, next) => orderController.getOrderById(req, res).catch(next));
router.get('/:orderId/ebill', authenticate, (req, res, next) => orderController.getEBill(req, res).catch(next));

export default router;
