import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { createApp } from "../src/app";
import { closeDatabase, Collections, connectToDatabase, getDb } from "../src/config/db";
import { createIndexes } from "../src/config/indexes";

export const app = createApp();

export const VALID_PASSWORD = "Password123";

/** Spins up an isolated in-memory MongoDB for the current test file and wipes it between tests. */
export const useTestDatabase = () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectToDatabase(mongo.getUri(), "test");
    await createIndexes();
  });

  beforeEach(async () => {
    const db = getDb();
    await Promise.all([
      db.collection(Collections.users).deleteMany({}),
      db.collection(Collections.listings).deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await closeDatabase();
    await mongo?.stop();
  });
};

/** Inserts a user directly (bypassing rate limits) and returns a valid bearer token for them. */
export const createUser = async (
  email = `user-${Math.random().toString(36).slice(2)}@example.com`,
  role: "USER" | "ADMIN" = "USER",
) => {
  const { insertedId } = await getDb()
    .collection(Collections.users)
    .insertOne({
      email,
      password: await bcrypt.hash(VALID_PASSWORD, 4),
      role,
      fullname: "Test User",
      contactno: "+44 7000 000000",
      address: "1 Secret Street",
      location: { city: "London", country: "UK", postcode: "E1 1AA" },
      createdAt: new Date(),
    });

  const res = await request(app).post("/auth/login").send({ email, password: VALID_PASSWORD });
  return { id: insertedId.toString(), email, token: res.body.data.accessToken as string };
};

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
