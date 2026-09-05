import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import pcBuilderRoutes from './pc-builder.routes.js';
import walletRoutes from './wallet.routes.js';
import adminRoutes from './admin.routes.js';
import resellerRoutes from './reseller.routes.js';
import contentRoutes from './content.routes.js';
import securityRoutes from './security.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/pc-builder', pcBuilderRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);
router.use('/reseller', resellerRoutes);
router.use('/content', contentRoutes);
router.use('/security', securityRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Enterprise Computer & Technology E-Commerce API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;
