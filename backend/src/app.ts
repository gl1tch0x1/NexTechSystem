import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { cloudflareSecurityMiddleware } from './middlewares/cloudflare-security.middleware.js';
import { apiLimiter } from './middlewares/rate-limiter.middleware.js';
import { initializeFirebase } from './config/firebase.js';
import { runSeed } from './seed/seed.js';
import { productRepository } from './repositories/product.repository.js';

import { csrfProtection } from './middlewares/csrf-protection.middleware.js';

export function createApp(): Express {
  const app = express();

  // Trust first proxy hop (Cloudflare / NGINX reverse proxy)
  app.set('trust proxy', 1);

  // Disable X-Powered-By header
  app.disable('x-powered-by');

  // 1. Initialize Firebase / Cloud components
  initializeFirebase();

  // 2. Global Cloudflare CDN, Anti-DDoS, Security & Logging Middleware
  app.use(cloudflareSecurityMiddleware);

  // Enhanced Helmet Security Headers with strict Content-Security-Policy & Frameguard
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://challenges.cloudflare.com',
            'https://*.google-analytics.com',
            'https://*.googletagmanager.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://images.unsplash.com',
            'https://*.firebasestorage.app',
            'https://challenges.cloudflare.com',
            'https://res.cloudinary.com',
          ],
          connectSrc: [
            "'self'",
            'https:',
            'http://localhost:*',
            'ws://localhost:*',
          ],
          frameSrc: [
            "'self'",
            'https://challenges.cloudflare.com',
            'https://checkout.tamara.co',
            'https://checkout.tabby.ai',
          ],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      frameguard: { action: 'sameorigin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // Flexible & Secure CORS policy for eCommerce web storefronts, preview branches, and API clients
  const corsOptions: cors.CorsOptions = {
    origin: (_origin, callback) => {
      // Allow all origins (browser reflects origin header, enabling credentials)
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'Accept',
      'Origin',
      'cf-connecting-ip',
      'cf-ray',
      'cf-ipcountry',
      'x-admin-pin',
    ],
    maxAge: 86400,
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CSRF Protection against unauthorized cross-site mutating requests
  app.use(csrfProtection);

  // 3. Mount Master REST API Routes with standard Rate Limiting
  app.use('/api', apiLimiter, routes);

  // Return JSON 404 for unhandled API routes instead of HTML error pages
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `API route not found: ${req.method} ${req.originalUrl}` },
    });
  });


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
