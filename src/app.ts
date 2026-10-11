import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { env, isTest } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimit";
import { requestLogger } from "./middleware/requestLogger";
import routes from "./routes";

/** Builds the Express app without opening a port or a DB connection, so tests can use it directly. */
export const createApp = () => {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS }));
  app.use(compression());
  app.use(express.json({ limit: "100kb" }));
  if (!isTest) app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(globalLimiter);
  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
