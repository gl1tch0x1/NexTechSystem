import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import fs from 'node:fs';
import path from 'node:path';

function getUploadDirs(): string[] {
  const cwd = process.cwd();
  return [
    path.resolve(cwd, 'uploads'),
    path.resolve(cwd, 'backend', 'uploads'),
    path.resolve(cwd, '..', 'uploads'),
    path.resolve(cwd, '..', 'backend', 'uploads'),
  ];
}

function contentTypeFor(filename: string): string {
  if (filename.endsWith('.webp')) return 'image/webp';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.gif')) return 'image/gif';
  if (filename.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> | { filename: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const filename = path.basename(String(resolvedParams.filename || ''));
  if (!/^[a-f0-9-]{32,64}\.(png|jpg|jpeg|webp|gif|pdf)$/i.test(filename)) {
    return Response.json({ success: false, error: { message: 'Asset not found.' } }, { status: 404 });
  }

  try {
    const upstream = await proxyToBackend(request, `/upload/${filename}`);
    if (upstream.ok) return upstream;
    if (upstream.status !== 404 && upstream.status !== 503) return upstream;
  } catch {
    // Fall through to local file lookup
  }

  const baseHash = path.parse(filename).name;
  const requestedExt = path.extname(filename).slice(1).toLowerCase();
  const candidates = ['png', 'jpg', 'jpeg'].includes(requestedExt)
    ? [`${baseHash}.webp`, filename]
    : [filename];

  for (const dir of getUploadDirs()) {
    for (const candidateName of candidates) {
      const candidate = path.resolve(dir, candidateName);
      if (!candidate.startsWith(dir)) continue;
      try {
        const data = fs.readFileSync(candidate);
        return new Response(data, {
          status: 200,
          headers: {
            'Content-Type': contentTypeFor(candidateName),
            'Cache-Control': candidateName.endsWith('.webp')
              ? 'public, max-age=31536000, immutable'
              : 'public, max-age=86400',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch {
        // Try next candidate
      }
    }
  }

  return Response.json({ success: false, error: { message: 'Asset not found.' } }, { status: 404 });
}

