import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list } from '@vercel/blob';

const BLOB_PATH = 'feeds/latest.json';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const result = await list({ prefix: BLOB_PATH, limit: 10 });
    const blob = result.blobs.find((item) => item.pathname === BLOB_PATH) ?? result.blobs[0];

    if (!blob) {
      res.status(404).json({ error: 'No cached feed found' });
      return;
    }

    const downloadUrl = (blob as any).downloadUrl || blob.url;
    const upstream = await fetch(downloadUrl);

    if (!upstream.ok) {
      res.status(502).json({ error: `Failed to read blob: ${upstream.status}` });
      return;
    }

    const payload = await upstream.json();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown feed error' });
  }
}
