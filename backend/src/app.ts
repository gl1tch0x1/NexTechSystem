import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { cloudflareSecurityMiddleware } from './middlewares/cloudflare-security.middleware.js';
import { initializeFirebase } from './config/firebase.js';
import { runSeed } from './seed/seed.js';
import { productRepository } from './repositories/product.repository.js';

export function createApp(): Express {
  const app = express();

  // 1. Initialize Firebase / Cloud components
  initializeFirebase();

  // 2. Global Cloudflare CDN, Anti-DDoS, Security & Logging Middleware
  app.use(cloudflareSecurityMiddleware);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // 3. Mount Master REST API Routes
  app.use('/api', routes);

  // 4. Centralized Error Handling
  app.use(errorHandler);

  // 5. Auto-seed if database is empty
  productRepository.find().then(products => {
    if (products.length === 0) {
      console.log('[Bootstrap] No products detected in repository. Running auto-seed...');
      runSeed(false).catch(err => console.error('[Bootstrap] Auto-seed failed:', err));
    }
  });

  return app;
}
