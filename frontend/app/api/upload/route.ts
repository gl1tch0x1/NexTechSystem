import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function POST(request: NextRequest) {
  try {
    const upstream = await proxyToBackend(request, '/upload');
    const responseBody = await upstream.clone().arrayBuffer();
    const responseHeaders = new Headers();
    const contentType = upstream.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);

    if (upstream.ok) {
      return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    }

    // Propagate upstream validation/auth errors instead of masking them as base64 uploads.
    if (upstream.status !== 503) {
      return new Response(responseBody, { status: upstream.status, headers: responseHeaders });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Image upload service is temporarily unavailable. Please try again in a moment.',
        },
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to upload image. Please try again.' } },
      { status: 503 }
    );
  }
}
