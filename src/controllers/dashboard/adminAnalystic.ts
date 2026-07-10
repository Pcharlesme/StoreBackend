import { Request, Response } from "express";
import { getDb } from "../../config/dbconnect";

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const DB = getDb();

    const [
      totalUsers,
      totalListings,
      activeListings,
      soldListings,
      expiredListings,
      deletedListings,
      freeListings,
      sellListings,
      swapListings,
    ] = await Promise.all([
      DB.collection("user").countDocuments(),

      DB.collection("products").countDocuments(),

      DB.collection("products").countDocuments({
        status: "ACTIVE",
      }),

      DB.collection("products").countDocuments({
        status: "SOLD",
      }),

      DB.collection("products").countDocuments({
        status: "EXPIRED",
      }),

      DB.collection("products").countDocuments({
        status: "DELETED",
      }),

      DB.collection("products").countDocuments({
        type: "FREE",
      }),

      DB.collection("products").countDocuments({
        type: "SELL",
      }),

      DB.collection("products").countDocuments({
        type: "SWAP",
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: totalUsers,

        listings: {
          total: totalListings,
          active: activeListings,
          sold: soldListings,
          expired: expiredListings,
          deleted: deletedListings,
        },

        listingTypes: {
          free: freeListings,
          sell: sellListings,
          swap: swapListings,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server failed",
    });
  }
};
