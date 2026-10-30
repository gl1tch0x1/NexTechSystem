import { proxyAuth } from '../../../../lib/auth-proxy';

export async function POST(request: Request) {
  return proxyAuth(request, 'logout');
}
