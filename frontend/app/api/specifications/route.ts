import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { SPECIFICATION_FIELDS, SPECIFICATION_PRESETS } from '@/lib/specification-presets';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/specifications', {
    fallbackData: {
      fields: SPECIFICATION_FIELDS,
      presets: SPECIFICATION_PRESETS,
    },
  });
}
