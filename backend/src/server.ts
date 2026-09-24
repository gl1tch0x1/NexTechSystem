import { createApp } from './app.js';
import { ENV } from './config/env.js';

const app = createApp();

const server = app.listen(ENV.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Tech E-Commerce Enterprise API Server Online!`);
  console.log(`📡 URL: http://localhost:${ENV.PORT}`);
  console.log(`🌐 Health: http://localhost:${ENV.PORT}/api/health`);
  console.log(`🔐 Mode: ${ENV.NODE_ENV}`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
