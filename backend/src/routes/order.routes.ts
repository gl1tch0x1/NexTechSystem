import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { orderLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Public cryptographically-signed ChatOps remote approval action (Discord / Telegram / Email 1-click)
router.get('/approval/remote', orderLimiter, (req, res, next) => orderController.handleRemoteApproval(req, res).catch(next));

// Apply order & transaction rate limiter & authentication for user endpoints
router.use(orderLimiter, authenticate);

router.post('/', (req, res, next) => orderController.createOrder(req, res).catch(next));
router.get('/my', (req, res, next) => orderController.getMyOrders(req, res).catch(next));
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res).catch(next));
router.get('/:orderId/ebill', (req, res, next) => orderController.getEBill(req, res).catch(next));

export default router;

