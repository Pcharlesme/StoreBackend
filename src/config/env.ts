import dotenv from "dotenv";
import { z } from "zod";

// `.env` is the convention; `config.env` is still read for older local setups.
dotenv.config({ path: [".env", "config.env"], quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().min(1).default("storeApp"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Comma-separated list of allowed browser origins
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // Number of reverse-proxy hops to trust (needed for correct client IPs in rate limiting)
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  AWS_S3_BUCKET: z.string().min(1, "AWS_S3_BUCKET is required"),
  // Optional: when omitted, the AWS SDK falls back to its default credential chain (IAM role, profile, ...)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${problems}`);
}

export const env = parsed.data;
export const isTest = env.NODE_ENV === "test";
