import { NextRequest } from 'next/server';
import { proxyAuth } from '../../../../lib/auth-proxy';

/**
 * Authentication is owned by the API service. Keeping this route as a
 * transparent proxy returns its signed session cookie and token intact, and
 * prevents a second, separately configured frontend JWT signer from failing.
 */
export async function POST(request: NextRequest): Promise<Response> {
  return proxyAuth(request, 'login');
}

export async function GET(): Promise<Response> {
  return Response.json({
    success: true,
    message: 'NexTech Authentication Gateway Active. Submit a POST request with email and password to authenticate.',
  });
}
