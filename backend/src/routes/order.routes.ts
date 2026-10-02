import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { orderLimiter } from '../middlewares/rate-limiter.middleware.js';

const router = Router();

// Public cryptographically-signed ChatOps remote approval endpoints (Discord / Telegram / Email 1-click)
router.get('/approval/approve', orderLimiter, (req, res, next) => orderController.handleRemoteApprove(req, res).catch(next));
router.get('/approval/reject', orderLimiter, (req, res, next) => orderController.handleRemoteReject(req, res).catch(next));

// Backwards-compatible redirect for legacy /approval/remote links
router.get('/approval/remote', orderLimiter, (req, res) => {
  const { orderId, action, token } = req.query;
  const safeOrderId = encodeURIComponent(String(orderId || ''));
  const safeToken = encodeURIComponent(String(token || ''));
  const isReject = String(action || '').toUpperCase() === 'REJECT';
  const target = isReject ? 'reject' : 'approve';
  res.redirect(307, `/api/orders/approval/${target}?orderId=${safeOrderId}&token=${safeToken}`);
});

// Apply order & transaction rate limiter & authentication for user endpoints
router.use(orderLimiter, authenticate);

router.post('/', (req, res, next) => orderController.createOrder(req, res).catch(next));
router.get('/my', (req, res, next) => orderController.getMyOrders(req, res).catch(next));
router.get('/:id', (req, res, next) => orderController.getOrderById(req, res).catch(next));
router.get('/:orderId/ebill', (req, res, next) => orderController.getEBill(req, res).catch(next));

export default router;

