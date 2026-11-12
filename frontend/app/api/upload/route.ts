import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export async function POST(request: NextRequest) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: 'Authentication required to upload assets.' } },
      { status: 401 }
    );
  }

  // Clone request before passing to proxyToBackend so body stream can be read if upstream returns 404
  const clonedRequest = request.clone();

  try {
    const upstream = await proxyToBackend(request, '/upload');
    if (upstream.ok) {
      return upstream;
    }

    // If backend route is not found (404), fall back to safe Base64 Data URL
    if (upstream.status === 404) {
      const formData = await clonedRequest.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: { message: 'No file provided.' } },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: { message: 'File size exceeds maximum allowed limit (5 MB).' } },
          { status: 400 }
        );
      }

      const mimeType = file.type.toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          { success: false, error: { message: 'Unsupported file type. Please upload a PNG, JPG, WEBP, or GIF.' } },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
      });
    }

    return upstream;
  } catch {
    try {
      const formData = await clonedRequest.formData();
      const file = formData.get('file') as File | null;
      if (!file || !ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) || file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: { message: 'Valid image under 5 MB is required.' } },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      return NextResponse.json({
        success: true,
        url: `data:${file.type.toLowerCase()};base64,${buffer.toString('base64')}`,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'Failed to process uploaded file.' } },
        { status: 500 }
      );
    }
  }
}
