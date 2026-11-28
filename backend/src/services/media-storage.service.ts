import { GridFSBucket, ObjectId } from 'mongodb';
import sharp from 'sharp';
import { mongoDb } from '../config/mongodb.js';

export type MediaStorageProvider = 'mongodb-gridfs';

export interface StoredMediaAsset {
  url: string;
  path: string;
  filename: string;
  assetId: string;
  hash: string;
  provider: MediaStorageProvider;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  originalFilename: string;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

function sanitizeExt(ext: string): string {
  const clean = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  return IMAGE_EXTENSIONS.has(clean) || clean === 'pdf' ? clean : 'bin';
}

export async function uploadMediaAsset(params: {
  buffer: Buffer;
  contentType: string;
  originalExtension: string;
  hash: string;
  originalFilename?: string;
}): Promise<StoredMediaAsset> {
  if (!mongoDb.isConnected()) {
    throw new Error('MongoDB is unavailable. The image could not be persisted.');
  }

  const ext = sanitizeExt(params.originalExtension);
  const filename = `${params.hash}.${ext}`;
  const db = mongoDb.getDb();
  if (!db) throw new Error('MongoDB database is unavailable.');

  let width: number | undefined;
  let height: number | undefined;
  if (params.contentType.startsWith('image/')) {
    try {
      const metadata = await sharp(params.buffer, { failOn: 'error' }).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch {
      throw new Error('The uploaded image is corrupted or unsupported.');
    }
  }

  const gridFsBucket = new GridFSBucket(db, { bucketName: 'product_assets' });
  const uploadStream = gridFsBucket.openUploadStream(filename, {
    metadata: {
      contentType: params.contentType,
      contentHash: params.hash,
      originalFilename: params.originalFilename || filename,
      uploadedAt: new Date().toISOString(),
      width,
      height,
    },
  });
  const assetId = uploadStream.id.toHexString();

  await new Promise<void>((resolve, reject) => {
    uploadStream.once('error', reject);
    uploadStream.once('finish', resolve);
    uploadStream.end(params.buffer);
  });

  return {
    url: `/api/upload/${assetId}`,
    path: `product_assets/${assetId}`,
    filename,
    assetId,
    hash: params.hash,
    provider: 'mongodb-gridfs',
    contentType: params.contentType,
    size: params.buffer.length,
    width,
    height,
    originalFilename: params.originalFilename || filename,
  };
}

export async function deleteGridFsAsset(assetId: string): Promise<{ deleted: boolean; provider: MediaStorageProvider | 'unknown'; reason?: string }> {
  if (!ObjectId.isValid(assetId)) return { deleted: false, provider: 'unknown', reason: 'invalid-gridfs-id' };
  const db = mongoDb.getDb();
  if (!db) return { deleted: false, provider: 'mongodb-gridfs', reason: 'mongodb-unavailable' };
  try {
    const bucket = new GridFSBucket(db, { bucketName: 'product_assets' });
    await bucket.delete(new ObjectId(assetId));
    return { deleted: true, provider: 'mongodb-gridfs' };
  } catch (err: any) {
    if (err?.code === 'ENOENT' || err?.message?.includes('FileNotFound')) {
      return { deleted: true, provider: 'mongodb-gridfs', reason: 'not-found' };
    }
    return { deleted: false, provider: 'mongodb-gridfs', reason: err?.message || 'delete-failed' };
  }
}

export async function openGridFsAsset(assetId: string) {
  if (!ObjectId.isValid(assetId)) return null;
  const db = mongoDb.getDb();
  if (!db) return null;
  const bucket = new GridFSBucket(db, { bucketName: 'product_assets' });
  const files = await db.collection('product_assets.files').find({ _id: new ObjectId(assetId) }).limit(1).toArray();
  if (!files.length) return null;
  return {
    file: files[0] as any,
    stream: bucket.openDownloadStream(new ObjectId(assetId)),
  };
}