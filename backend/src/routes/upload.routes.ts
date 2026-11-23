import crypto, { randomUUID } from 'node:crypto';
import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { resellerRepository } from '../repositories/reseller.repository.js';

const router = Router();
const directory = path.resolve(process.cwd(), 'uploads');

const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf']);
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(directory, { recursive: true });
    } catch {
      // Directory exists or created
    }
    cb(null, directory);
  },
  filename: (_req, file, cb) => {
    const rawExt = path.extname(file.originalname || '').slice(1).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : 'bin';
    cb(null, `${randomUUID()}.${safeExt}`);
  },
});

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
  const filename = path.basename(String(req.params.filename || ''));
  if (!/^[a-f0-9-]{32,64}\.(png|jpg|jpeg|webp|gif|pdf)$/i.test(filename)) {
    res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
    return;
  }

  const candidateDirs = [
    directory,
    path.resolve(process.cwd(), 'backend', 'uploads'),
    path.resolve(process.cwd(), '..', 'uploads'),
  ];

  const baseHash = path.parse(filename).name;
  const requestedExt = path.extname(filename).slice(1).toLowerCase();

  // If a legacy .png or .jpg was requested, prefer serving the existing .webp version
  const checkFilenames = (['png', 'jpg', 'jpeg'].includes(requestedExt))
    ? [`${baseHash}.webp`, filename]
    : [filename];

  let foundPath: string | null = null;
  for (const dir of candidateDirs) {
    for (const candFilename of checkFilenames) {
      const candidate = path.resolve(dir, candFilename);
      if (candidate.startsWith(dir) && !candidate.includes('..')) {
        let fd: number | null = null;
        try {
          fd = fs.openSync(candidate, 'r');
          foundPath = candidate;
          break;
        } catch {
          // Path does not exist or cannot be read; continue
        } finally {
          if (fd !== null) {
            try { fs.closeSync(fd); } catch {}
          }
        }
      }
    }
    if (foundPath) break;
  }

  if (!foundPath) {
    res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
    return;
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (foundPath.endsWith('.webp')) {
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (foundPath.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  res.sendFile(foundPath, error => {
    if (error && !res.headersSent) res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
  });
});

async function handleFileUpload(req: any, res: any) {
  const file = req.file;
  if (!file || !file.filename) {
    res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
    return;
  }

  // Strictly validate filename against allowlist pattern to prevent path traversal (CWE-22 / js/path-injection)
  const rawFilename = path.basename(String(file.filename));
  if (!/^[a-f0-9-]{32,64}\.(png|jpg|jpeg|webp|gif|pdf)$/i.test(rawFilename)) {
    res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
    return;
  }

  const filePath = path.resolve(directory, rawFilename);
  if (!filePath.startsWith(directory) || filePath.includes('..')) {
    res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
    return;
  }

  let isValid = false;
  try {
    const fd = await fsPromises.open(filePath, 'r');
    const header = Buffer.alloc(16);
    await fd.read(header, 0, 16, 0);
    await fd.close();

    const ext = path.extname(rawFilename).slice(1).toLowerCase();
    const signatures: Record<string, (b: Buffer) => boolean> = {
      png: b => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      jpg: b => b[0] === 255 && b[1] === 216 && b[2] === 255,
      jpeg: b => b[0] === 255 && b[1] === 216 && b[2] === 255,
      gif: b => /^GIF8[79]a$/.test(b.subarray(0, 6).toString()),
      webp: b => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
      pdf: b => b.subarray(0, 5).toString() === '%PDF-',
    };
    const check = signatures[ext];
    isValid = Boolean(check && check(header));
  } catch {
    isValid = false;
  }

  if (!isValid) {
    await fsPromises.unlink(filePath).catch(() => {});
    res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
    return;
  }

  // Automatic WebP Conversion and cryptographic SHA-256 content-addressable hash formatting
  const ext = path.extname(rawFilename).slice(1).toLowerCase();
  let finalFilename: string;
  let contentHash = '';

  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    try {
      const inputBuffer = await fsPromises.readFile(filePath);
      const webpBuffer = await sharp(inputBuffer)
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      contentHash = crypto.createHash('sha256').update(webpBuffer).digest('hex');
      const hashFilename = `${contentHash}.webp`;
      const hashPath = path.resolve(directory, hashFilename);

      await fsPromises.writeFile(hashPath, webpBuffer);

      // Clean up uploaded temp file if name differs
      if (rawFilename !== hashFilename) {
        await fsPromises.unlink(filePath).catch(() => {});
      }
      finalFilename = hashFilename;
    } catch {
      finalFilename = rawFilename;
    }
  } else {
    // Non-image document (e.g. PDF trade license)
    try {
      const inputBuffer = await fsPromises.readFile(filePath);
      contentHash = crypto.createHash('sha256').update(inputBuffer).digest('hex');
      const hashFilename = `${contentHash}.${ext}`;
      const hashPath = path.resolve(directory, hashFilename);

      await fsPromises.writeFile(hashPath, inputBuffer);
      if (rawFilename !== hashFilename) {
        await fsPromises.unlink(filePath).catch(() => {});
      }
      finalFilename = hashFilename;
    } catch {
      finalFilename = rawFilename;
    }
  }

  res.status(201).json({
    success: true,
    url: `/api/upload/${finalFilename}`,
    hash: contentHash,
    imageHash: contentHash,
    filename: finalFilename,
  });
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

// Reseller onboarding document upload (for initial registration documents verification)
router.post(
  '/reseller-document',
  (req, res, next) => {
    upload.single('file')(req, res, error => {
      if (error) {
        res.status(400).json({ success: false, error: { message: 'Document upload must contain one file no larger than 5 MB.' } });
        return;
      }
      next();
    });
  },
  handleFileUpload
);

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

export default router;
