import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import fsPromises from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

test('Upload & Media Pipeline: Automatic WebP Format Conversion', async (t) => {
  const originalCwd = process.cwd();
  const testDir = mkdtempSync(path.join(tmpdir(), 'nextech-upload-webp-test-'));
  process.chdir(testDir);
  const uploadsDir = path.resolve(testDir, 'uploads');
  await fsPromises.mkdir(uploadsDir, { recursive: true });

  const { default: uploadRouter } = await import('../src/routes/upload.routes.js');

  const mockResponse = () => ({
    statusCode: 200,
    body: undefined as any,
    headers: {} as Record<string, string>,
    sentFile: null as string | null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    sendFile(filePath: string, cb?: (err?: any) => void) {
      this.sentFile = filePath;
      if (cb) cb();
      return this;
    },
  });

  // Extract the handler from router stack
  const routeLayer = (uploadRouter.stack as any[]).find(
    (layer: any) => layer.route && layer.route.path === '/' && layer.route.methods.post
  );
  assert.ok(routeLayer, 'Upload POST route should be registered');
  const uploadHandler = routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;

  await t.test('1. PNG upload automatically converts to .webp with optimized size and .webp URL', async () => {
    // Generate valid 10x10 PNG buffer
    const pngBuf = await sharp({
      create: { width: 10, height: 10, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    }).png().toBuffer();

    const uuid = randomUUID();
    const pngFilename = `${uuid}.png`;
    const pngPath = path.resolve(uploadsDir, pngFilename);
    writeFileSync(pngPath, pngBuf);

    const mockReq = {
      file: {
        filename: pngFilename,
        originalname: 'test-product-cover.png',
        mimetype: 'image/png',
        size: pngBuf.length,
      },
    };
    const mockRes = mockResponse();

    await uploadHandler(mockReq, mockRes);

    assert.equal(mockRes.statusCode, 201);
    assert.ok(mockRes.body.success);
    assert.ok(mockRes.body.url.endsWith('.webp'), 'Output URL must end in .webp');
    assert.equal(mockRes.body.url, `/api/upload/${uuid}.webp`);

    // Verify converted file on disk is actual WebP with RIFF / WEBP magic bytes
    const savedWebpPath = path.resolve(uploadsDir, `${uuid}.webp`);
    const webpData = await fsPromises.readFile(savedWebpPath);
    assert.equal(webpData.subarray(0, 4).toString(), 'RIFF');
    assert.equal(webpData.subarray(8, 12).toString(), 'WEBP');
  });

  await t.test('2. JPEG upload automatically converts to .webp format', async () => {
    // Generate valid 10x10 JPEG buffer
    const jpegBuf = await sharp({
      create: { width: 10, height: 10, channels: 3, background: { r: 0, g: 255, b: 0 } },
    }).jpeg().toBuffer();

    const uuid = randomUUID();
    const jpgFilename = `${uuid}.jpg`;
    const jpgPath = path.resolve(uploadsDir, jpgFilename);
    writeFileSync(jpgPath, jpegBuf);

    const mockReq = {
      file: {
        filename: jpgFilename,
        originalname: 'hardware-spec.jpeg',
        mimetype: 'image/jpeg',
        size: jpegBuf.length,
      },
    };
    const mockRes = mockResponse();

    await uploadHandler(mockReq, mockRes);

    assert.equal(mockRes.statusCode, 201);
    assert.ok(mockRes.body.success);
    assert.ok(mockRes.body.url.endsWith('.webp'));
    assert.equal(mockRes.body.url, `/api/upload/${uuid}.webp`);
  });

  await t.test('3. Non-image PDF document remains .pdf without conversion', async () => {
    const pdfBuf = Buffer.from('%PDF-1.4 sample pdf content for reseller verification');
    const uuid = randomUUID();
    const pdfFilename = `${uuid}.pdf`;
    const pdfPath = path.resolve(uploadsDir, pdfFilename);
    writeFileSync(pdfPath, pdfBuf);

    const mockReq = {
      file: {
        filename: pdfFilename,
        originalname: 'Trade_License.pdf',
        mimetype: 'application/pdf',
        size: pdfBuf.length,
      },
    };
    const mockRes = mockResponse();

    await uploadHandler(mockReq, mockRes);

    assert.equal(mockRes.statusCode, 201);
    assert.ok(mockRes.body.success);
    assert.ok(mockRes.body.url.endsWith('.pdf'));
    assert.equal(mockRes.body.url, `/api/upload/${uuid}.pdf`);
  });

  process.chdir(originalCwd);
});
