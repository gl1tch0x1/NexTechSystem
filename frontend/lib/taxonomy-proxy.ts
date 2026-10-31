export async function proxyTaxonomy(endpoint: 'categories' | 'brands'): Promise<Response> {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const configured = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  let base = isProd ? 'https://api.nextechsystem.com' : 'http://localhost:5000';
  if (configured) {
    const isLocal = configured.includes('localhost') || configured.includes('127.0.0.1');
    if (!isLocal || !isProd) {
      base = configured.replace(/\/$/, '').replace(/\/api$/, '');
    }
  }
  try {
    const upstream = await fetch(`${base}/api/products/${endpoint}`, {
      cache: 'no-store', signal: AbortSignal.timeout(10000), redirect: 'manual',
    });
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ success: false, error: { message: 'Catalog categories and brands are temporarily unavailable.' } }, { status: 503 });
  }
}
