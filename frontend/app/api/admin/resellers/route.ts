import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

function loadFallbackResellers(): any[] {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'backend', 'data_store', 'resellers.json'),
      path.resolve(process.cwd(), 'data_store', 'resellers.json'),
      path.resolve(process.cwd(), '..', 'backend', 'data_store', 'resellers.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [];
}

export async function GET(request: NextRequest) {
  // 1. Try upstream backend
  try {
    const upstream = await proxyToBackend(request, '/admin/resellers');
    if (upstream.ok) {
      const json = await upstream.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      if (list.length > 0) {
        return NextResponse.json({ success: true, data: list });
      }
    }
  } catch {}

  // 2. Query MongoDB Atlas
  try {
    const db = await getMongoDb();
    if (db) {
      const resellersFromUsers = await db.collection('users').find({ role: 'RESELLER' }).toArray();
      if (resellersFromUsers && resellersFromUsers.length > 0) {
        const formatted = resellersFromUsers.map(r => ({
          id: r.id,
          displayName: r.name || r.company || 'Enterprise Reseller Partner',
          businessName: r.company || r.name,
          email: r.email,
          status: r.isActive !== false ? 'ACTIVE' : 'SUSPENDED',
          businessInformation: {
            businessType: 'Value-Added Reseller (VAR)',
            settlementTerms: 'Direct Settlement Net-30',
          },
        }));
        return NextResponse.json({ success: true, data: formatted });
      }
    }
  } catch (err: any) {
    console.warn('[Resellers GET Mongo Warning]:', err?.message || err);
  }

  const fallback = loadFallbackResellers();
  return NextResponse.json({ success: true, data: fallback });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/admin/resellers');
}
