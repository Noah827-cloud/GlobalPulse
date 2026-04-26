import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = typeof req.query.url === 'string' ? req.query.url : '';

  if (!url) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; GlobalPulse/1.0; +https://vercel.com)'
      }
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream RSS failed: ${upstream.status}` });
      return;
    }

    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).send(text);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unknown RSS proxy error' });
  }
}
