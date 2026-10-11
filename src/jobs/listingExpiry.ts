import cron, { ScheduledTask } from "node-cron";
import { Collections, getDb } from "../config/db";

/** Marks ACTIVE listings past their expiry date as EXPIRED. */
export const expireListings = async (now = new Date()) => {
  const { modifiedCount } = await getDb()
    .collection(Collections.listings)
    .updateMany(
      { status: "ACTIVE", expiryDate: { $lte: now } },
      { $set: { status: "EXPIRED", updatedAt: now } },
    );
  return modifiedCount;
};

// Runs every 15 minutes. With multiple instances each one runs it, which is safe
// because the update is idempotent, but a distributed lock would avoid duplicated work.
export const startListingExpiryJob = (): ScheduledTask =>
  cron.schedule("*/15 * * * *", async () => {
    try {
      const count = await expireListings();
      if (count > 0) console.log(`Listing expiry job: ${count} listing(s) expired`);
    } catch (error) {
      console.error("Listing expiry job failed:", error);
    }
  });
