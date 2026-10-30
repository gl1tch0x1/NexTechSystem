export async function proxyTaxonomy(endpoint: 'categories' | 'brands'): Promise<Response> {
  const configured = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const base = configured.replace(/\/$/, '').replace(/\/api$/, '');
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
