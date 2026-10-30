import { proxyAuth } from '../../../../lib/auth-proxy';

export async function GET(request: Request) {
  return proxyAuth(request, 'me');
}
