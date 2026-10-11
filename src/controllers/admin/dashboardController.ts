import { Request, Response } from "express";
import { Collections, getDb } from "../../config/db";
import { ListingStatuses, ListingTypes } from "../../schemas/listing";

type CountBucket = { _id: string; count: number };

const toCounts = <K extends string>(keys: readonly K[], buckets: CountBucket[]) =>
  Object.fromEntries(
    keys.map((key) => [key.toLowerCase(), buckets.find((b) => b._id === key)?.count ?? 0]),
  ) as Record<Lowercase<K>, number>;

export const getAdminDashboard = async (_req: Request, res: Response) => {
  const db = getDb();

  // One aggregation for all listing counts instead of a countDocuments() per bucket
  const [users, [facets]] = await Promise.all([
    db.collection(Collections.users).countDocuments(),
    db
      .collection(Collections.listings)
      .aggregate<{ total: { count: number }[]; byStatus: CountBucket[]; byType: CountBucket[] }>([
        {
          $facet: {
            total: [{ $count: "count" }],
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            byType: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
          },
        },
      ])
      .toArray(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      listings: {
        total: facets.total[0]?.count ?? 0,
        ...toCounts(ListingStatuses, facets.byStatus),
      },
      listingTypes: toCounts(ListingTypes, facets.byType),
    },
  });
};
