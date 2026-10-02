import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { orderLimiter } from '../middlewares/rate-limiter.middleware.js';
import { ENV } from '../config/env.js';

const router = Router();

// Safe navigation redirects to the authenticated Admin Command Center
router.get(['/approval/remote', '/approval/approve', '/approval/reject'], orderLimiter, (req, res) => {
  const orderId = encodeURIComponent(String(req.query.orderId || ''));
  const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');
  res.redirect(302, `${clientUrl}/admin/orders${orderId ? `?orderId=${orderId}` : ''}`);
});

// Apply order & transaction rate limiter & authentication for user endpoints
router.use(orderLimiter, authenticate);

router.post('/', (req, res, next) => orderController.createOrder(req, res).catch(next));
router.get('/my', (req, res, next) => orderController.getMyOrders(req, res).catch(next));
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res).catch(next));
router.get('/:orderId/ebill', (req, res, next) => orderController.getEBill(req, res).catch(next));

export default router;

