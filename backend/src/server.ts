import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { mongoDb } from './config/mongodb.js';
import { dbStore } from './config/db-store.js';
import { orderService } from './services/order.service.js';

const app = createApp();

const server = app.listen(ENV.PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Tech E-Commerce Enterprise API Server Online!`);
  console.log(`📡 URL: http://localhost:${ENV.PORT}`);
  console.log(`🌐 Health: http://localhost:${ENV.PORT}/api/health`);
  console.log(`🔐 Mode: ${ENV.NODE_ENV}`);
  console.log(`====================================================`);

  // Initialize MongoDB Enterprise Connection & Bootstrap
  if (ENV.ENABLE_MONGODB) {
    try {
      const isConnected = await mongoDb.connect();
      if (isConnected) {
        await dbStore.syncToMongoIfEmpty();
      }
    } catch (err: any) {
      console.warn('⚠️ [MongoDB Startup Notice]:', err?.message || err);
    }
  }

  // Periodic in-store reservation cleanup (every 15 mins)
  const reservationInterval = setInterval(async () => {
    try {
      await orderService.releaseExpiredInStoreReservations();
    } catch (err: any) {
      console.error('⚠️ [ReservationCleanup Error]:', err?.message || err);
    }
  }, 15 * 60 * 1000);
  reservationInterval.unref();
});

const handleShutdown = async (signal: string) => {
  console.log(`${signal} signal received: closing HTTP server and MongoDB connections...`);
  server.close(async () => {
    await mongoDb.close();
    console.log('HTTP and MongoDB server connections successfully closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
