import { Db, MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const client = new MongoClient(process.env.ATLAS_URI as string, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let database: Db | null = null;

export const connectToserver = async () => {
  await client.connect();
  database = client.db("storeApp");
  console.log("Database is alive... working");
};


export const getDb = () => {
  if (!database) throw new Error("DB not initialized");
  return database;
};
