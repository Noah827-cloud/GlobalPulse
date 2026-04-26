import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { buildLatestFeedPayload } from './_lib/refresh-feed.js';
import { BLOB_PATH } from './_lib/shared.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const payload = await buildLatestFeedPayload();

    await put(BLOB_PATH, JSON.stringify(payload), {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json'
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown refresh error' });
  }
}
