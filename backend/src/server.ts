import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { mongoDb } from './config/mongodb.js';
import { dbStore } from './config/db-store.js';
import { orderService } from './services/order.service.js';

const app = createApp();
let server: ReturnType<typeof app.listen> | undefined;

async function startServer(): Promise<ReturnType<typeof app.listen>> {
  if (ENV.ENABLE_MONGODB) {
    const isConnected = await mongoDb.connect();
    if (!isConnected && ENV.NODE_ENV === 'production') {
      const status = await mongoDb.getStatus();
      throw new Error(`MongoDB startup validation failed: ${status.lastError || 'connection unavailable'}`);
    }
    if (isConnected) {
      await dbStore.syncToMongoIfEmpty();
    } else {
      console.warn('[MongoDB Startup Notice]: Development server will continue with explicitly enabled local fallback.');
    }
  } else if (ENV.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is not configured.');
  } else {
    console.warn('[MongoDB Startup Notice]: MONGODB_URI is not configured. Development fallback is active.');
  }

  const listeningServer = app.listen(ENV.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Tech E-Commerce Enterprise API Server Online!`);
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`🌐 Health: http://localhost:${ENV.PORT}/api/health`);
    console.log(`🔐 Mode: ${ENV.NODE_ENV}`);
    console.log(`====================================================`);
  });

  const reservationInterval = setInterval(async () => {
    try {
      await orderService.releaseExpiredInStoreReservations();
    } catch (err: any) {
      console.error('⚠️ [ReservationCleanup Error]:', err?.message || err);
    }
  }, 15 * 60 * 1000);
  reservationInterval.unref();

  return listeningServer;
}

void startServer().then(listeningServer => {
  server = listeningServer;
}).catch((err: any) => {
  console.error('[Startup Fatal]:', err?.message || err);
  process.exit(1);
});

const handleShutdown = async (signal: string) => {
  console.log(`${signal} signal received: closing HTTP server and MongoDB connections...`);
  if (!server) {
    await mongoDb.close();
    process.exit(0);
    return;
  }
  server.close(async () => {
    await mongoDb.close();
    console.log('HTTP and MongoDB server connections successfully closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]:', reason);
});

export default app;
export { app, server };
