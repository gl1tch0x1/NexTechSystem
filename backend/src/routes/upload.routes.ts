import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

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

router.get('/:filename', (req, res) => {
  const filename = path.basename(String(req.params.filename || ''));
  if (!/^[a-f0-9-]{36}\.(png|jpg|jpeg|webp|gif|pdf)$/.test(filename)) {
    res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
    return;
  }
  const filePath = path.resolve(directory, filename);
  if (!filePath.startsWith(directory) || filePath.includes('..')) {
    res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
    return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (filename.endsWith('.pdf')) res.setHeader('Content-Disposition', 'attachment');
  res.sendFile(filePath, error => {
    if (error && !res.headersSent) res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
  });
});

router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'PRODUCT_EDITOR'),
  (req, res, next) => {
    upload.single('file')(req, res, error => {
      if (error) {
        res.status(400).json({ success: false, error: { message: 'Upload must contain one file no larger than 5 MB.' } });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    const file = req.file;
    if (!file || !file.filename) {
      res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
      return;
    }

    // Strictly validate filename against allowlist pattern to prevent path traversal (CWE-22 / js/path-injection)
    const rawFilename = path.basename(String(file.filename));
    if (!/^[a-f0-9-]{36}\.(png|jpg|jpeg|webp|gif|pdf)$/.test(rawFilename)) {
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

    res.status(201).json({ success: true, url: `/api/upload/${rawFilename}` });
  }
);

export default router;
