import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getMongoDb, syncAllBundledDataToMongo } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  // 1. Try upstream Express backend
  try {
    const upstream = await proxyToBackend(request, '/admin/database/sync-to-mongo');
    if (upstream.ok) return upstream;
  } catch {}

  // 2. Direct Next.js Server to MongoDB Atlas fallback
  try {
    const db = await getMongoDb();
    if (db) {
      const stats = await syncAllBundledDataToMongo(db);
      return NextResponse.json({
        success: true,
        message: `Direct Cloud Sync Completed: ${stats.usersSynced} users, ${stats.categoriesSynced} categories, ${stats.brandsSynced} brands, ${stats.settingsSynced} settings synchronized to MongoDB Atlas database.`,
        data: stats,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Database synchronization failed.' } }, { status: 500 });
  }

  return NextResponse.json({ success: false, error: { message: 'Database service is temporarily unavailable.' } }, { status: 503 });
}
