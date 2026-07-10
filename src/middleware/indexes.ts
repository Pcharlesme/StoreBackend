import { getDb } from "../config/dbconnect";

export const createIndexes = async () => {
  const DB = getDb();

  await DB.collection("user").createIndex(
    {
      email: 1,
    },
    {
      unique: true,
    },
  );

  await DB.collection("products").createIndex({
    ownerId: 1,
  });

  await DB.collection("products").createIndex({
    category: 1,
  });

  await DB.collection("products").createIndex({
    status: 1,
    createdAt: -1,
  });

  console.log("✅ MongoDB indexes created");
};
