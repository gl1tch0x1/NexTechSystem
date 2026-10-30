import { proxyAuth } from '../../../../lib/auth-proxy';

export async function POST(request: Request) {
  return proxyAuth(request, 'login');
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'NexTech Authentication Gateway Active. Submit a POST request with email and password to authenticate.',
  });
}
