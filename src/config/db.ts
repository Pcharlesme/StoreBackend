import { Db, MongoClient, ServerApiVersion } from "mongodb";

// Collection names are kept as-is for compatibility with existing data.
export const Collections = {
  users: "user",
  listings: "products",
} as const;

let client: MongoClient | null = null;
let database: Db | null = null;

export const connectToDatabase = async (uri: string, dbName: string) => {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  database = client.db(dbName);
  return database;
};

export const getDb = () => {
  if (!database) throw new Error("Database not initialized. Call connectToDatabase() first.");
  return database;
};

export const closeDatabase = async () => {
  await client?.close();
  client = null;
  database = null;
};
