import { getCatalogCategories, getCatalogBrands, getAllCatalogProducts, matchesCategoryFilter } from './catalog-service';

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
      cache: 'no-store', signal: AbortSignal.timeout(5000), redirect: 'manual',
    });
    if (upstream.ok) {
      const data = await upstream.json();
      if (data && Array.isArray(data.data) && data.data.length >= 5) {
        return Response.json(data, {
          status: 200,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
      }
    }
  } catch {
    // Upstream unavailable, seamlessly fall back to verified authoritative local catalog taxonomy
  }

  if (endpoint === 'categories') {
    const prods = getAllCatalogProducts();
    const categories = getCatalogCategories().map(cat => {
      const matched = prods.filter(p => matchesCategoryFilter(p, cat.id)).length;
      return {
        ...cat,
        productCount: matched > 0 ? matched : (cat.productCount && cat.productCount > 0 ? cat.productCount : matched),
      };
    });
    return Response.json({ success: true, data: categories }, { status: 200 });
  }

  if (endpoint === 'brands') {
    const brands = getCatalogBrands();
    return Response.json({ success: true, data: brands }, { status: 200 });
  }

  return Response.json({ success: false, error: { message: 'Catalog taxonomy temporarily unavailable.' } }, { status: 503 });
}

