import cron from "node-cron";
import { getDb } from "../config/dbconnect";

export const startDeListingExpiryJob = () => {
  // runs every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const DB = getDb();
      const result = await DB.collection("products").updateMany(
        {
          status: "ACTIVE",
          expiryDate: {
            $lte: new Date(),
          },
        },
        {
          $set: {
            status: "EXPIRED",
            updatedAt: new Date(),
          },
        }
      );
      console.log(
        `Expired listings updated: ${result.modifiedCount}`
      );

    } catch (error) {
      console.error("Listing expiry job failed:", error);
    }
  });
};