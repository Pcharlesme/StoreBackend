// Runs before any test module is imported, so src/config/env.ts validates these values.
// Every value here is a dummy: tests never talk to real MongoDB Atlas or AWS.
Object.assign(process.env, {
  NODE_ENV: "test",
  MONGODB_URI: "mongodb://placeholder", // replaced by the in-memory server's URI per suite
  MONGODB_DB_NAME: "test",
  JWT_SECRET: "test-secret-that-is-definitely-long-enough",
  JWT_EXPIRES_IN: "1h",
  AWS_REGION: "us-east-1",
  AWS_S3_BUCKET: "test-bucket",
});
