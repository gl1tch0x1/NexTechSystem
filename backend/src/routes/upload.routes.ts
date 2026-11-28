import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { deleteGridFsAsset, openGridFsAsset, uploadMediaAsset } from '../services/media-storage.service.js';
import { mongoDb } from '../config/mongodb.js';

const router = Router();

const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf']);
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, false);
      return;
    }
    cb(null, true);
  },
});

router.get('/:filename', async (req, res) => {
  const requested = path.basename(String(req.params.filename || ''));

  // Compatibility retrieval for assets created before GridFS migration.
  const legacyMatch = requested.match(/^([a-f0-9]{64})(?:\.(webp|png|jpg|jpeg|gif|pdf))?$/i);
  if (legacyMatch) {
    const hash = legacyMatch[1].toLowerCase();
    const requestedExt = legacyMatch[2]?.toLowerCase();
    const candidateNames = requestedExt === 'webp'
      ? [`${hash}.webp`, `${hash}.png`, `${hash}.jpg`, `${hash}.jpeg`, `${hash}.gif`, `${hash}.pdf`]
      : requestedExt
        ? [`${hash}.${requestedExt}`]
        : [`${hash}.webp`, `${hash}.png`, `${hash}.jpg`, `${hash}.jpeg`, `${hash}.gif`, `${hash}.pdf`];
    const candidateDirs = [
      path.resolve(process.cwd(), 'backend', 'uploads'),
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(process.cwd(), '..', 'uploads'),
    ];
    for (const dir of candidateDirs) {
      for (const candidateName of candidateNames) {
        const candidate = path.resolve(dir, candidateName);
        if (!candidate.startsWith(dir) || candidate.includes('..')) continue;
        try {
          const stat = fs.statSync(candidate);
          if (!stat.isFile()) continue;
          const ext = path.extname(candidateName).toLowerCase();
          const contentType = ext === '.pdf' ? 'application/pdf'
            : ext === '.png' ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
            : ext === '.gif' ? 'image/gif'
            : 'image/webp';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', String(stat.size));
          res.setHeader('Cache-Control', contentType.startsWith('image/') ? 'public, max-age=86400' : 'private, max-age=3600');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          fs.createReadStream(candidate).pipe(res);
          return;
        } catch {}
      }
    }
  }

  const assetId = requested.replace(/[^a-f0-9]/gi, '');
  if (!/^[a-f0-9]{24}$/i.test(assetId)) {
    res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
    return;
  }
  try {
    const opened = await openGridFsAsset(assetId);
    if (!opened) {
      res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
      return;
    }
    const contentType = String(opened.file.metadata?.contentType || opened.file.contentType || 'application/octet-stream');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(opened.file.length));
    res.setHeader('Cache-Control', contentType.startsWith('image/') ? 'public, max-age=31536000, immutable' : 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    opened.stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ success: false, error: { message: 'Asset could not be read.' } });
      else res.end();
    });
    opened.stream.pipe(res);
  } catch {
    res.status(503).json({ success: false, error: { code: 'MONGODB_UNAVAILABLE', message: 'MongoDB is unavailable.' } });
  }
});

async function handleFileUpload(req: any, res: any) {
  const file = req.file;
  if (!file || !file.buffer) {
    res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
    return;
  }

  const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
  const buffer: Buffer = file.buffer;
  const header = buffer.subarray(0, 16);
  const signatures = new Map<string, (b: Buffer) => boolean>([
    ['png', b => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))],
    ['jpg', b => b[0] === 255 && b[1] === 216],
    ['jpeg', b => b[0] === 255 && b[1] === 216],
    ['gif', b => /^GIF8[79]a$/.test(b.subarray(0, 6).toString())],
    ['webp', b => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'],
    ['pdf', b => b.subarray(0, 5).toString() === '%PDF-'],
  ]);
  const check = signatures.get(ext);
  if (typeof check !== 'function' || !check(header) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
    return;
  }

  let finalBuffer = buffer;
  let finalExt = ext;
  let contentType = file.mimetype;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    try {
      const { default: sharp } = await import('sharp');
      finalBuffer = await sharp(buffer).rotate().webp({ quality: 85, effort: 4 }).toBuffer();
      finalExt = 'webp';
      contentType = 'image/webp';
    } catch {
      res.status(400).json({ success: false, error: { message: 'The uploaded image is corrupted or unsupported.' } });
      return;
    }
  }

  const contentHash = crypto.createHash('sha256').update(finalBuffer).digest('hex');

  let storedAssetId: string | null = null;
  try {
    if (!mongoDb.isConnected()) {
      res.status(503).json({ success: false, error: { code: 'MONGODB_UNAVAILABLE', message: 'MongoDB is unavailable. The image was not persisted.' } });
      return;
    }
    const stored = await uploadMediaAsset({
      buffer: finalBuffer,
      contentType,
      originalExtension: finalExt,
      hash: contentHash,
      originalFilename: file.originalname,
    });
    storedAssetId = stored.assetId;

    const productId = String(req.query.productId || '').trim();
    if (productId) {
      const product = await productRepository.findById(productId);
      if (!product) {
        await deleteGridFsAsset(stored.assetId);
        res.status(404).json({ success: false, error: { message: 'Product not found.' } });
        return;
      }
      if (req.user?.role === 'RESELLER') {
        const resellerId = req.user.resellerId;
        if (!resellerId || (product as any).resellerId !== resellerId) {
          await deleteGridFsAsset(stored.assetId);
          res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only manage images for your own products.' } });
          return;
        }
      }
      const existingAssets = Array.isArray((product as any).imageAssets) ? (product as any).imageAssets : [];
      const existingImages = Array.isArray((product as any).images) ? (product as any).images : [];
      const replaceAssetId = String(req.query.replaceAssetId || '').trim();
      let replaceIndex = -1;
      let oldAssetUrl = '';
      if (replaceAssetId) {
        if (!/^[a-f0-9]{24}$/i.test(replaceAssetId)) {
          await deleteGridFsAsset(stored.assetId);
          res.status(400).json({ success: false, error: { message: 'Invalid replacement asset ID.' } });
          return;
        }
        replaceIndex = existingAssets.findIndex((asset: any) => String(asset.id || asset.assetId || '') === replaceAssetId);
        if (replaceIndex < 0) {
          await deleteGridFsAsset(stored.assetId);
          res.status(404).json({ success: false, error: { message: 'The asset to replace is not associated with this product.' } });
          return;
        }
        oldAssetUrl = `/api/upload/${replaceAssetId}`;
      }
      const asset = {
        id: stored.assetId,
        assetId: stored.assetId,
        originalFilename: stored.originalFilename,
        mimeType: stored.contentType,
        size: stored.size,
        width: stored.width,
        height: stored.height,
        uploadedAt: new Date().toISOString(),
        altText: (product as any).name || (product as any).title || '',
        order: existingAssets.length,
        isPrimary: existingAssets.length === 0 && existingImages.length === 0,
        url: stored.url,
      };
      const nextAssets = replaceIndex >= 0
        ? existingAssets.map((existing: any, index: number) => index === replaceIndex ? {
            ...asset,
            order: Number.isInteger(existing.order) ? existing.order : index,
            isPrimary: Boolean(existing.isPrimary),
            altText: existing.altText || asset.altText,
          } : existing)
        : [...existingAssets, asset];
      const nextImages = replaceIndex >= 0
        ? existingImages.map((image: string) => image === oldAssetUrl ? stored.url : image)
        : [...existingImages, stored.url];
      const replacingPrimary = replaceIndex >= 0 &&
        (Boolean(existingAssets[replaceIndex]?.isPrimary) || String((product as any).primaryImage || '') === oldAssetUrl);
      const nextPrimary = replacingPrimary
        ? stored.url
        : (replaceIndex >= 0
          ? (String((product as any).primaryImage || '') || nextImages[0] || '')
          : (existingAssets.length === 0 && existingImages.length === 0 ? stored.url : ((product as any).primaryImage || existingImages[0] || stored.url)));
      const updated = await productRepository.update(productId, {
        images: nextImages,
        primaryImage: nextPrimary,
        thumbnail: nextPrimary,
        image: nextPrimary,
        imageAssets: nextAssets,
      } as any);
      if (!updated) {
        await deleteGridFsAsset(stored.assetId);
        res.status(500).json({ success: false, error: { message: 'Failed to persist the product image association.' } });
        return;
      }
      if (replaceIndex >= 0) {
        const db = mongoDb.getDb();
        let shared = false;
        if (db) {
          shared = Boolean(await db.collection('products').findOne({
            $or: [
              { 'imageAssets.id': replaceAssetId },
              { 'imageAssets.assetId': replaceAssetId },
              { images: oldAssetUrl },
            ],
          }, { projection: { _id: 1 } }));
        }
        if (!shared) {
          await deleteGridFsAsset(replaceAssetId);
        }
      }
    }

    res.status(201).json({
      success: true,
      url: stored.url,
      assetId: stored.assetId,
      hash: contentHash,
      imageHash: contentHash,
      filename: stored.filename,
      provider: stored.provider,
      contentType: stored.contentType,
      size: stored.size,
      width: stored.width,
      height: stored.height,
    });
  } catch (err: any) {
    if (storedAssetId) {
      await deleteGridFsAsset(storedAssetId).catch(() => undefined);
    }
    const uploadError = (err instanceof Error ? err.message : String(err)).replace(/\n|\r/g, '');
    console.error('[Upload] Failed to persist media asset:', uploadError);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to persist uploaded media to storage. Please verify storage configuration and retry.',
      },
    });
  }
}

/**
 * Access control middleware: Only Master Admin, Product Editor, or verified Reseller can upload images.
 */
async function requireMediaUploadAuthorized(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
    return;
  }

  // Master Administrators and Product Editors are fully authorized
  if (req.user.role === 'ADMIN' || req.user.role === 'PRODUCT_EDITOR') {
    return next();
  }

  // Resellers are authorized ONLY if their account has been validated and approved by an admin
  if (req.user.role === 'RESELLER') {
    const resellerId = req.user.resellerId || (await resellerRepository.findByUserId(req.user.id))?.id;
    if (resellerId) {
      const reseller = await resellerRepository.findById(resellerId);
      if (reseller && reseller.status === 'ACTIVE') {
        return next();
      }
    }
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Reseller account is pending admin verification. Only verified Resellers can upload media assets.',
      },
    });
    return;
  }

  res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access restricted. Only Administrators, Product Editors, and Verified Resellers can upload media assets.',
    },
  });
}

// Protected image & media asset upload: Strictly Admin, Product Editor, or Verified Reseller
router.post(
  '/',
  authenticate,
  requireMediaUploadAuthorized,
  (req, res, next) => {
    upload.single('file')(req, res, error => {
      if (error) {
        res.status(400).json({ success: false, error: { message: 'Upload must contain one file no larger than 5 MB.' } });
        return;
      }
      next();
    });
  },
  handleFileUpload
);

// Delete a managed GridFS asset only after removing it from the product association.
router.delete(
  '/',
  authenticate,
  requireMediaUploadAuthorized,
  async (req: AuthenticatedRequest, res: Response) => {
    const url = String((req.body as any)?.url || '').trim();
    const assetId = String((req.body as any)?.assetId || '').trim();
    const productId = String((req.body as any)?.productId || '').trim();
    const match = url.match(/^\/api\/upload\/([a-f0-9]{24})$/i);
    const resolvedAssetId = assetId || match?.[1] || '';
    if (!/^[a-f0-9]{24}$/i.test(resolvedAssetId) || !productId) {
      res.status(400).json({ success: false, error: { message: 'Provide a productId and a managed GridFS assetId.' } });
      return;
    }
    const product = await productRepository.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, error: { message: 'Product not found.' } });
      return;
    }
    if (req.user?.role === 'RESELLER') {
      if (!req.user.resellerId || (product as any).resellerId !== req.user.resellerId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only manage images for your own products.' } });
        return;
      }
    }
    const assets = Array.isArray((product as any).imageAssets) ? (product as any).imageAssets : [];
    const nextAssets = assets.filter((asset: any) => String(asset.id || asset.assetId || '') !== resolvedAssetId);
    const managedUrl = `/api/upload/${resolvedAssetId}`;
    const nextImages = (Array.isArray((product as any).images) ? (product as any).images : []).filter((image: string) => image !== managedUrl);
    let nextPrimary = String((product as any).primaryImage || '');
    const removedPrimary = nextPrimary === managedUrl ||
      assets.some((asset: any) => (asset.id || asset.assetId) === resolvedAssetId && asset.isPrimary);
    if (removedPrimary) {
      nextPrimary = nextImages[0] || '';
      nextAssets.forEach((asset: any, index: number) => {
        asset.isPrimary = index === 0;
        asset.order = index;
      });
    }
    const updated = await productRepository.update(productId, {
      images: nextImages,
      primaryImage: nextPrimary,
      thumbnail: nextPrimary,
      image: nextPrimary,
      imageAssets: nextAssets,
    } as any);
    if (!updated) {
      res.status(500).json({ success: false, error: { message: 'Failed to persist gallery deletion.' } });
      return;
    }

    const db = mongoDb.getDb();
    let shared = false;
    if (db) {
      shared = Boolean(await db.collection('products').findOne({
        $or: [
          { 'imageAssets.id': resolvedAssetId },
          { 'imageAssets.assetId': resolvedAssetId },
          { images: managedUrl },
        ],
      }, { projection: { _id: 1 } }));
    }
    if (!shared) {
      const result = await deleteGridFsAsset(resolvedAssetId);
      res.status(200).json({ success: true, deleted: result.deleted, provider: result.provider, reason: result.reason });
      return;
    }
    res.status(200).json({ success: true, deleted: false, provider: 'mongodb-gridfs', reason: 'shared-by-another-product' });
  }
);

export default router;
