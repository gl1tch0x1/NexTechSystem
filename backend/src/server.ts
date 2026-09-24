import { createApp } from "./app.js";
import { ENV } from "./config/env.js";
import { productRepository } from "./repositories/product.repository.js";
import { runSeed } from "./seed/seed.js";
import { ensureBootstrapAdmin } from "./services/admin-bootstrap.service.js";

async function start() {
  const products = await productRepository.find();
  if (products.length === 0) {
    console.log(
      "[Bootstrap] No products detected in repository. Running auto-seed...",
    );
    await runSeed(false);
  } else {
    await ensureBootstrapAdmin();
  }

  const app = createApp();
  const server = app.listen(ENV.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Tech E-Commerce Enterprise API Server Online!`);
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`🌐 Health: http://localhost:${ENV.PORT}/api/health`);
    console.log(`🔐 Mode: ${ENV.NODE_ENV}`);
    console.log(`====================================================`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
    });
  });
}

start().catch((error) => {
  console.error("[Bootstrap] Server startup failed:", error);
  process.exitCode = 1;
});
