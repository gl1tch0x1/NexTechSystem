import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || 'http://localhost:5000';
  const cleanBackend = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  try {
    const res = await fetch(`${cleanBackend}/api/reseller/template/download`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=nextech_hardware_sku_listing_template.xlsx',
          'Content-Length': buffer.byteLength.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    return NextResponse.json(
      { success: false, error: { message: `Backend returned ${res.status}` } },
      { status: res.status }
    );
  } catch (err: any) {
    console.error('[TemplateDownloadProxy] Error contacting backend:', err);
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to download template' } },
      { status: 502 }
    );
  }
}
