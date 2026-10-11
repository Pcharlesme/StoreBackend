import { createApp } from "./app";
import { closeDatabase, connectToDatabase } from "./config/db";
import { env } from "./config/env";
import { createIndexes } from "./config/indexes";
import { startListingExpiryJob } from "./jobs/listingExpiry";

const start = async () => {
  await connectToDatabase(env.MONGODB_URI, env.MONGODB_DB_NAME);
  await createIndexes();
  console.log(`Connected to MongoDB (${env.MONGODB_DB_NAME})`);

  // Started only after the DB is ready so the first run can't hit an uninitialized client
  const expiryJob = startListingExpiryJob();

  const server = createApp().listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // ===== Graceful shutdown =====
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    expiryJob.stop();
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
    // Don't hang forever on keep-alive connections
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
