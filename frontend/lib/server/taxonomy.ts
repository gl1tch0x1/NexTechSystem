type TaxonomyKind = 'categories' | 'brands';

export async function fetchTaxonomy(kind: TaxonomyKind): Promise<unknown[] | null> {
  const configured = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  const backend = configured || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
  if (!backend) return null;

  let endpoint: URL;
  try {
    endpoint = new URL(`${backend.replace(/\/$/, '').replace(/\/api$/, '')}/api/products/${kind}`);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(endpoint.protocol)) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) return result.data;
      }
      if (response.status < 500) break;
    } catch {
      // A development backend may be restarting. Give it one brief retry.
    }
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 400));
  }
  return null;
}
