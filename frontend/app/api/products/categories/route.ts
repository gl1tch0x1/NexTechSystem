import { NextResponse } from 'next/server';
import { fetchTaxonomy } from '@/lib/server/taxonomy';

export async function GET() {
  const categories = await fetchTaxonomy('categories');
  if (categories) return NextResponse.json({ success: true, data: categories });
  return NextResponse.json({ success: false, error: {
    code: 'DATA_UNAVAILABLE',
    message: 'Categories are temporarily unavailable. Check that the backend service is running.',
  } }, { status: 503 });
}
