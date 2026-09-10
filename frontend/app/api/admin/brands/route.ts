import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/admin/brands`, {
        headers,
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Fall through to database file
    }
  }

  // Fallback: Read directly from database store
  try {
    const candidates = [
      path.resolve(process.cwd(), 'data_store', 'brands.json'),
      path.resolve(process.cwd(), 'backend', 'data_store', 'brands.json'),
      path.resolve(process.cwd(), '..', 'data_store', 'brands.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(content || '[]');
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            success: true,
            data,
            meta: { total: data.length },
          });
        }
      }
    }
  } catch (err) {
    console.error('Error reading admin brands store:', err);
  }

  return NextResponse.json({
    success: true,
    data: [],
    meta: { total: 0 },
  });
}
