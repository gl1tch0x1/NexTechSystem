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
import { ENV } from './config/env.js';


export function createApp(): Express {
  const app = express();

  // Trust first proxy hop (Cloudflare / NGINX reverse proxy)
  app.set('trust proxy', 1);

  // 1. Initialize Firebase / Cloud components
  initializeFirebase();

  // 2. Global Cloudflare CDN, Anti-DDoS, Security & Logging Middleware
  app.use(cloudflareSecurityMiddleware);
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // Strict CORS policy with explicit origin whitelist validation (CWE-942)
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || ENV.ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Error: Origin '${origin}' is not permitted by NexTech Security Policy.`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'cf-connecting-ip',
      'cf-ray',
      'cf-ipcountry',
    ],
    maxAge: 86400,
  };
  app.use(cors(corsOptions));

  app.use(morgan('dev'));
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));


  // 3. Mount Master REST API Routes with standard Rate Limiting
  app.use('/api', apiLimiter, routes);


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
