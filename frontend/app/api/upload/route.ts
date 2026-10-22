import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf']);
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;

  // Reject files containing dangerous script tags / active content anywhere in header
  const headerText = buffer.subarray(0, 1024).toString('utf8').toLowerCase();
  if (
    headerText.includes('<script') ||
    headerText.includes('<html') ||
    headerText.includes('<?php') ||
    headerText.includes('onload=') ||
    headerText.includes('onerror=') ||
    headerText.includes('<svg')
  ) {
    return false;
  }

  switch (ext) {
    case 'png':
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    case 'jpg':
    case 'jpeg':
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'gif':
      return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
    case 'webp':
      return (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer.length >= 12 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
      );
    case 'pdf':
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce authentication check (cookie or Bearer header)
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to upload assets' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'brands';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed limit (5 MB)' },
        { status: 400 }
      );
    }

    // 3. Validate extension
    const originalName = file.name || 'upload';
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file extension. Allowed formats: PNG, JPG, WEBP, GIF, PDF' },
        { status: 400 }
      );
    }

    // 4. Validate declared MIME type
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid file MIME type' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Validate magic bytes to prevent masqueraded executable/HTML files (OWASP A03 Stored XSS defense)
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { success: false, error: 'File content verification failed. Executable or HTML content is strictly prohibited.' },
        { status: 400 }
      );
    }

    const safeFolder = folder === 'uploads' ? 'uploads' : 'brands';
    const uploadDir = path.join(process.cwd(), 'public', safeFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 6. Generate cryptographically randomized filename
    const safeName = `${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}.${ext}`;
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/${safeFolder}/${safeName}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error('Upload failed:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
