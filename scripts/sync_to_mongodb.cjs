const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend/.env
const envPath = path.resolve(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const { MongoClient } = require(path.resolve(__dirname, '../backend/node_modules/mongodb'));

async function syncAllToMongo() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'nextech_ecommerce';

  console.log('====================================================');
  console.log('   MongoDB Database Synchronization Engine');
  console.log('====================================================');

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in backend/.env!');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB cluster...`);
  console.log(`Target Database: "${dbName}"`);

  let client;
  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    console.log(' Connected to MongoDB Atlas successfully!');
  } catch (err) {
    console.error('\n❌ Could not connect to MongoDB Atlas cluster:');
    console.error('   ', err.message);
    if (err.message.includes('alert number 80') || err.message.includes('SSL') || err.message.includes('timeout')) {
      console.log('\n💡 Atlas Firewall Notice:');
      console.log('   MongoDB Atlas blocks connections from IPs that are not in the IP Access List.');
      console.log('   Please log in to MongoDB Atlas -> Network Access -> Add IP Address:');
      console.log('   Allow: 0.0.0.0/0 (Anywhere) OR your current public IP.');
    }
    process.exit(1);
  }

  const db = client.db(dbName);
  const dataDir = path.resolve(__dirname, '../backend/data_store');

  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Data store directory not found at: ${dataDir}`);
    await client.close();
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  console.log(`\nFound ${files.length} collections to synchronize into MongoDB:\n`);

  let totalDocsSynced = 0;
  let totalCollectionsSynced = 0;

  for (const file of files) {
    const colName = file.replace(/\.json$/, '');
    const filePath = path.join(dataDir, file);

    try {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      if (!content) continue;

      const parsed = JSON.parse(content);
      const docs = Array.isArray(parsed) ? parsed : (parsed.value && Array.isArray(parsed.value) ? parsed.value : []);

      if (docs.length === 0) {
        console.log(` - ${colName}: 0 documents (empty)`);
        continue;
      }

      const col = db.collection(colName);

      // Create unique index on 'id' if not already present
      try {
        await col.createIndex({ id: 1 }, { unique: true, sparse: true });
      } catch (idxErr) {
        // index may already exist
      }

      // Upsert each document by 'id'
      let syncedCount = 0;
      for (const doc of docs) {
        if (!doc) continue;
        const id = doc.id || doc._id;
        if (id) {
          const { _id, ...cleanDoc } = doc;
          await col.updateOne(
            { id },
            { $set: cleanDoc },
            { upsert: true }
          );
          syncedCount++;
        }
      }

      console.log(` ✅ ${colName.padEnd(25)} -> ${syncedCount} documents synchronized to MongoDB`);
      totalDocsSynced += syncedCount;
      totalCollectionsSynced++;
    } catch (err) {
      console.error(` ❌ Error syncing ${colName}:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 Synchronization Complete!`);
  console.log(`   Collections Synced: ${totalCollectionsSynced}`);
  console.log(`   Total Documents in MongoDB: ${totalDocsSynced}`);
  console.log('====================================================\n');

  await client.close();
}

syncAllToMongo().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});

