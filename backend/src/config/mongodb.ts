import { MongoClient, Db, Collection, ServerApiVersion, Document } from 'mongodb';
import { ENV } from './env.js';

export interface MongoStatus {
  connected: boolean;
  connecting: boolean;
  dbName: string;
  cluster: string;
  lastConnectedAt: string | null;
  lastError: string | null;
  totalCollections: number;
}

class MongoDbManager {
  private static instance: MongoDbManager;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;
  private connected: boolean = false;
  private lastError: string | null = null;
  private lastConnectedAt: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): MongoDbManager {
    if (!MongoDbManager.instance) {
      MongoDbManager.instance = new MongoDbManager();
    }
    return MongoDbManager.instance;
  }

  public async connect(): Promise<boolean> {
    if (this.connected && this.client && this.db) return true;
    if (this.isConnecting) return false;

    const uri = ENV.MONGODB_URI;
    if (!uri) {
      this.lastError = 'MONGODB_URI environment variable is not defined.';
      console.warn('⚠️ [MongoDB] MONGODB_URI is not set. Operating in local-resilient storage mode.');
      return false;
    }

    this.isConnecting = true;
    try {
      console.log('🔄 [MongoDB] Initializing enterprise connection to MongoDB Atlas...');
      this.client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 50,
        minPoolSize: 5,
        retryWrites: true,
        w: 'majority',
      });

      await this.client.connect();
      const dbName = ENV.MONGODB_DB_NAME || 'nextech_ecommerce';
      this.db = this.client.db(dbName);

      // Verify connection with ping
      await this.db.command({ ping: 1 });
      this.connected = true;
      this.lastConnectedAt = new Date().toISOString();
      this.lastError = null;
      console.log(`✅ [MongoDB] Connected successfully to MongoDB Atlas database "${dbName}"!`);

      // Clear reconnect timer if any
      if (this.reconnectTimer) {
        clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      return true;
    } catch (err: any) {
      this.connected = false;
      this.lastError = err?.message || String(err);
      console.warn('⚠️ [MongoDB Notice] Could not connect to MongoDB Atlas cluster:', this.lastError);
      console.warn('💡 [MongoDB Tip] Ensure your public IP is added to the MongoDB Atlas Network Access allowlist (or 0.0.0.0/0). Local-resilient storage is active with zero downtime.');
      
      // Schedule background reconnect attempts every 60s
      this.scheduleReconnect();
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setInterval(async () => {
      if (!this.connected && !this.isConnecting) {
        console.log('🔄 [MongoDB] Attempting background reconnection to MongoDB Atlas...');
        await this.connect();
      }
    }, 60000);
    // Don't keep event loop alive solely for reconnection timer
    if (this.reconnectTimer.unref) {
      this.reconnectTimer.unref();
    }
  }

  public isConnected(): boolean {
    return this.connected && this.db !== null;
  }

  public getDb(): Db | null {
    return this.db;
  }

  public getCollection<T extends Document = any>(name: string): Collection<T> | null {
    if (!this.isConnected() || !this.db) return null;
    return this.db.collection<T>(name);
  }

  public async getStatus(): Promise<MongoStatus> {
    let totalCollections = 0;
    if (this.isConnected() && this.db) {
      try {
        const collections = await this.db.listCollections().toArray();
        totalCollections = collections.length;
      } catch (e) {
        // ignore
      }
    }
    return {
      connected: this.connected,
      connecting: this.isConnecting,
      dbName: ENV.MONGODB_DB_NAME || 'nextech_ecommerce',
      cluster: 'nextechsystems.jd7k9ew.mongodb.net',
      lastConnectedAt: this.lastConnectedAt,
      lastError: this.lastError,
      totalCollections,
    };
  }

  public async close(): Promise<void> {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.client) {
      await this.client.close();
      this.connected = false;
      this.client = null;
      this.db = null;
      console.log('🔒 [MongoDB] Connection closed.');
    }
  }
}

export const mongoDb = MongoDbManager.getInstance();
