import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
const directory = path.resolve(process.cwd(), 'uploads');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

router.get('/:filename', (req, res) => {
  const filename = String(req.params.filename);
  if (!/^[a-f0-9-]{36}\.(png|jpg|jpeg|webp|gif|pdf)$/.test(filename)) {
    res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
    return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (filename.endsWith('.pdf')) res.setHeader('Content-Disposition', 'attachment');
  res.sendFile(path.join(directory, filename), error => {
    if (error && !res.headersSent) res.status(404).json({ success: false, error: { message: 'Asset not found.' } });
  });
});

router.post('/', authenticate, requireRole('ADMIN', 'PRODUCT_EDITOR'), (req, res, next) => {
  upload.single('file')(req, res, error => {
    if (error) { res.status(400).json({ success: false, error: { message: 'Upload must contain one file no larger than 5 MB.' } }); return; }
    next();
  });
}, async (req, res) => {
  const file = req.file;
  const ext = path.extname(file?.originalname || '').slice(1).toLowerCase();
  const signatures: Record<string, { mime: string; valid: (b: Buffer) => boolean }> = {
    png: { mime: 'image/png', valid: b => b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
    jpg: { mime: 'image/jpeg', valid: b => b[0] === 255 && b[1] === 216 && b[2] === 255 },
    jpeg: { mime: 'image/jpeg', valid: b => b[0] === 255 && b[1] === 216 && b[2] === 255 },
    gif: { mime: 'image/gif', valid: b => /^GIF8[79]a$/.test(b.subarray(0,6).toString()) },
    webp: { mime: 'image/webp', valid: b => b.subarray(0,4).toString() === 'RIFF' && b.subarray(8,12).toString() === 'WEBP' },
    pdf: { mime: 'application/pdf', valid: b => b.subarray(0,5).toString() === '%PDF-' },
  };
  const rule = signatures[ext];
  if (!file || !rule || file.mimetype !== rule.mime || !rule.valid(file.buffer)) {
    res.status(400).json({ success: false, error: { message: 'Provide a valid PNG, JPG, WEBP, GIF, or PDF file.' } });
    return;
  }
  await fs.mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(directory, filename), file.buffer, { flag: 'wx', mode: 0o600 });
  res.status(201).json({ success: true, url: `/api/upload/${filename}` });
});

export default router;
