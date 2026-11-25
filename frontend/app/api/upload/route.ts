import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

function getUploadDirs(): string[] {
  const cwd = process.cwd();
  const dirs = [
    path.resolve(cwd, 'uploads'),
    path.resolve(cwd, 'backend', 'uploads'),
    path.resolve(cwd, '..', 'uploads'),
    path.resolve(cwd, '..', 'backend', 'uploads'),
    path.resolve(os.tmpdir(), 'nextech-uploads'),
  ];
  if (process.env.VERCEL) {
    dirs.push('/tmp/nextech-uploads');
  }
  return Array.from(new Set(dirs));
}

async function saveLocalUpload(file: Blob): Promise<Response> {
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return NextResponse.json(
      { success: false, error: { message: 'Unsupported file type. Please upload a PNG, JPG, WEBP, GIF, or PDF document.' } },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, error: { message: 'File size exceeds maximum allowed limit (5 MB).' } },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type.toLowerCase();
  let finalBuffer = buffer;
  let ext = 'bin';

  if (mimeType.startsWith('image/') && mimeType !== 'image/svg+xml') {
    try {
      finalBuffer = await sharp(buffer).webp({ quality: 85, effort: 4 }).toBuffer();
      ext = 'webp';
    } catch {
      finalBuffer = buffer;
      ext =
        mimeType === 'image/png'
          ? 'png'
          : mimeType === 'image/webp'
            ? 'webp'
            : mimeType === 'image/gif'
              ? 'gif'
              : 'jpg';
    }
  } else if (mimeType === 'application/pdf') {
    ext = 'pdf';
    finalBuffer = buffer;
  } else {
    return NextResponse.json(
      { success: false, error: { message: 'Unsupported file type. Please upload a PNG, JPG, WEBP, GIF, or PDF document.' } },
      { status: 400 }
    );
  }

  const contentHash = crypto.createHash('sha256').update(finalBuffer).digest('hex');
  const filename = `${contentHash}.${ext}`;

  const uploadDirs = getUploadDirs();
  let saved = false;
  for (const dir of uploadDirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.resolve(dir, filename), finalBuffer);
      saved = true;
      break;
    } catch {
      // Try next candidate directory
    }
  }

  if (!saved) {
    // Last-resort fallback: return an optimized data URL when no writable storage is available.
    // This keeps uploads working in read-only serverless environments; upstream save errors are surfaced by callers.
    const dataUrl = `data:${ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`};base64,${finalBuffer.toString('base64')}`;
    if (dataUrl.length <= 2_500_000) {
      return NextResponse.json({
        success: true,
        url: dataUrl,
        hash: contentHash,
        imageHash: contentHash,
        filename,
        storage: 'inline-data-url',
      });
    }
    return NextResponse.json(
      { success: false, error: { message: 'Failed to store uploaded file. Please try again with a smaller image.' } },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    url: `/api/upload/${filename}`,
    hash: contentHash,
    imageHash: contentHash,
    filename,
  });
}

export async function POST(request: NextRequest) {
  const clonedRequest = request.clone();
  try {
    const upstream = await proxyToBackend(request, '/upload');
    const responseBody = await upstream.clone().arrayBuffer();
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);

    if (upstream.ok) {
      return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    }

    // If the backend upload route is missing/unavailable, fall back to local storage.
    // Propagate real auth/validation errors from a live backend.
    const responseText = new TextDecoder().decode(responseBody).toLowerCase();
    const isMissingRoute =
      upstream.status === 404 &&
      (responseText.includes('route not found') || responseText.includes('not_found') || responseText.includes('cannot post'));
    const isUnavailable = upstream.status === 502 || upstream.status === 503 || upstream.status === 504;
    if (!isMissingRoute && !isUnavailable) {
      return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    }

    const formData = await clonedRequest.formData().catch(() => null);
    const file = formData?.get('file');
    if (!(file instanceof Blob)) {
      return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    }
    return await saveLocalUpload(file);
  } catch {
    try {
      const formData = await clonedRequest.formData().catch(() => null);
      const file = formData?.get('file');
      if (file instanceof Blob) {
        return await saveLocalUpload(file);
      }
    } catch {
      // Fall through to error response
    }
    return NextResponse.json(
      { success: false, error: { message: 'Failed to upload image. Please try again.' } },
      { status: 503 }
    );
  }
}
