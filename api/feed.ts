import type { VercelRequest, VercelResponse } from '@vercel/node';
import { get } from '@vercel/blob';
import { BLOB_PATH } from './_lib/shared.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const result = await get(BLOB_PATH, { access: 'private' });

    if (!result || result.statusCode !== 200 || !result.stream) {
      res.status(404).json({ error: 'No cached feed found' });
      return;
    }

    const payload = await new Response(result.stream).json();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown feed error' });
  }
}
