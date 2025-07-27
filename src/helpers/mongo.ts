import { MongoClient, Collection } from "mongodb";

// Use the same DATABASE_URL you use for Prisma
const uri = process.env.DATABASE_URL as string;

if (!uri) {
  throw new Error("Missing DATABASE_URL environment variable");
}

// Optional: Use globalThis to persist MongoClient across hot reloads in development
declare global {
  // Prevent TypeScript errors on global
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

const globalForMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
};

let client: MongoClient;

async function getClient(): Promise<MongoClient> {
  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri);
    await globalForMongo._mongoClient.connect();
  }

  client = globalForMongo._mongoClient;
  return client;
}

export const getMongoCollection = async <T extends Document = any>(
  collectionName: string
): Promise<Collection<T>> => {
  const client = await getClient();
  const db = client.db(); // uses DB from URI by default
  return db.collection<T>(collectionName);
};
