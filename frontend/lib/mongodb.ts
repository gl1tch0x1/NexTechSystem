import { MongoClient, Db } from 'mongodb';

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://s7704mojtaba_db_user:i5hI8QEvQ8LR6QSm@nextechsystems.jd7k9ew.mongodb.net/?retryWrites=true&w=majority&appName=NexTechSystems';
const dbName = process.env.MONGODB_DB_NAME || 'nextech_ecommerce';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoDb(): Promise<Db | null> {
  if (!uri) return null;
  try {
    if (!clientPromise) {
      client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 8000,
        serverSelectionTimeoutMS: 5000,
      });
      clientPromise = client.connect();
    }
    const c = await clientPromise;
    return c.db(dbName);
  } catch (err: any) {
    console.warn('[MongoDB Frontend Client Warning]:', err?.message || err);
    clientPromise = null;
    return null;
  }
}
