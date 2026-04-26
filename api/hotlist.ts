import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = typeof req.query.id === 'string' ? req.query.id : '';

  if (!id) {
    res.status(400).json({ error: 'Missing id query parameter' });
    return;
  }

  try {
    const targetUrl = `https://newsnow.busiyi.world/api/s?id=${encodeURIComponent(id)}&latest`;
    const upstream = await fetch(targetUrl, {
      headers: {
        accept: 'application/json,text/plain,*/*',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        referer: 'https://newsnow.busiyi.world/',
        origin: 'https://newsnow.busiyi.world'
      }
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Upstream hotlist failed: ${upstream.status}` });
      return;
    }

    const json = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    res.status(200).send(json);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unknown hotlist proxy error' });
  }
}
