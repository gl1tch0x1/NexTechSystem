import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import crypto from 'node:crypto';
import fs from 'node:fs';
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
  return [
    path.resolve(cwd, 'uploads'),
    path.resolve(cwd, 'backend', 'uploads'),
    path.resolve(cwd, '..', 'uploads'),
    path.resolve(cwd, '..', 'backend', 'uploads'),
  ];
}

async function saveLocalUpload(file: File): Promise<Response> {
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
    return NextResponse.json(
      { success: false, error: { message: 'Failed to store uploaded file. Please try again.' } },
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
    const isMissingRoute = upstream.status === 404;
    const isUnavailable = upstream.status === 503;
    if (!isMissingRoute && !isUnavailable) {
      return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    }

    const formData = await clonedRequest.formData().catch(() => null);
    const file = formData?.get('file');
    if (!(file instanceof File)) {
      return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    }
    return await saveLocalUpload(file);
  } catch {
    try {
      const formData = await clonedRequest.formData().catch(() => null);
      const file = formData?.get('file');
      if (file instanceof File) {
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
