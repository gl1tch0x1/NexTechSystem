import { NextResponse } from 'next/server';
import { fetchTaxonomy } from '@/lib/server/taxonomy';

export async function GET() {
  const brands = await fetchTaxonomy('brands');
  if (brands) return NextResponse.json({ success: true, data: brands });
  return NextResponse.json({ success: false, error: {
    code: 'DATA_UNAVAILABLE',
    message: 'Brands are temporarily unavailable. Check that the backend service is running.',
  } }, { status: 503 });
}
