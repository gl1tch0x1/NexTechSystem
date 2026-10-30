import { proxyTaxonomy } from '@/lib/taxonomy-proxy';

export async function GET() {
  return proxyTaxonomy('brands');
}
