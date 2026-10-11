import { Collections, getDb } from "./db";

export const createIndexes = async () => {
  const db = getDb();
  const listings = db.collection(Collections.listings);

  await Promise.all([
    db.collection(Collections.users).createIndex({ email: 1 }, { unique: true }),
    listings.createIndex({ ownerId: 1, createdAt: -1 }),
    listings.createIndex({ category: 1 }),
    listings.createIndex({ status: 1, createdAt: -1 }),
    // Supports the expiry job's { status, expiryDate <= now } scan
    listings.createIndex({ status: 1, expiryDate: 1 }),
  ]);
};
