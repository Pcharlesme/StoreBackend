import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { connectToserver, getDb } from "./src/config/dbconnect";
import auth from "./src/routes/auth/accountAuth";
import { startDeListingExpiryJob } from "./src/middleware/autolistingExpiry";
import { createIndexes } from "./src/middleware/indexes";

const app = express();

const PORT = process.env.PORT || 3000;

// Global middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
  }),
);

app.use(helmet());
app.use(express.json());
// add logger

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
    );
  });
  next();
});
app.use(compression());
app.use(auth);

// cron to start delisting expired product
startDeListingExpiryJob();
// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const startServer = async () => {
  await connectToserver();
  await createIndexes();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
