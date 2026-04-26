import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripTags = (input: string): string => (
  input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const extractSummary = (html: string): string => {
  const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og?.trim()) return og.trim();

  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (desc?.trim()) return desc.trim();

  const paragraphMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => stripTags(match[1] || ''))
    .filter((text) => text.length > 40);

  return paragraphMatches[0]?.slice(0, 180) || '';
};

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
      res.status(upstream.status).json({ error: `Upstream summary failed: ${upstream.status}` });
      return;
    }

    const html = await upstream.text();
    const summary = extractSummary(html);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    res.status(200).json({ summary });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Unknown summary proxy error' });
  }
}
