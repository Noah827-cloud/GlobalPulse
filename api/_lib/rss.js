import { NewsCategory, RSS_SOURCES } from './shared.js';

const matchFirst = (input, pattern) => {
  const match = input.match(pattern);
  return match?.[1]?.trim() ?? '';
};

const decodeXmlEntities = (input) => (
  input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
);

const stripHtml = (input) => (
  decodeXmlEntities(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const extractTagText = (input, tagName) => {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)</${escaped}>`, 'i');
  return decodeXmlEntities(matchFirst(input, pattern));
};

const extractRssItems = (xmlText) => {
  const itemMatches = Array.from(xmlText.matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((match) => match[0]);
  if (itemMatches.length > 0) return itemMatches;
  return Array.from(xmlText.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)).map((match) => match[0]);
};

const extractLinkFromItemXml = (itemXml) => {
  const textLink = extractTagText(itemXml, 'link');
  if (textLink) return textLink;

  const hrefLink = matchFirst(itemXml, /<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return decodeXmlEntities(hrefLink);
};

const extractImageUrlFromItemXml = (itemXml) => {
  const patterns = [
    /<enclosure\b[^>]*type=["'][^"']*image[^"']*["'][^>]*url=["']([^"']+)["'][^>]*>/i,
    /<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["'][^"']*image[^"']*["'][^>]*>/i,
    /<media:thumbnail\b[^>]*url=["']([^"']+)["'][^>]*>/i,
    /<media:content\b[^>]*url=["']([^"']+)["'][^>]*>/i,
    /<itunes:image\b[^>]*href=["']([^"']+)["'][^>]*>/i,
    /<content:encoded\b[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<description\b[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const url = matchFirst(itemXml, pattern);
    if (url) return url;
  }

  return '';
};

const getFallbackImage = (category) => {
  switch (category) {
    case NewsCategory.POLITICS:
      return '/fallback/politics.jpg';
    case NewsCategory.FINANCE:
      return '/fallback/finance.jpg';
    case NewsCategory.AI:
      return '/fallback/ai.jpg';
    case NewsCategory.ENTERTAINMENT:
      return '/fallback/entertainment.jpg';
    default:
      return '/fallback/general.jpg';
  }
};

const upscaleImageUrl = (url, category) => {
  if (!url) return getFallbackImage(category);
  if (url.includes('ichef.bbci.co.uk')) return url.replace(/\/(news|cps)\/\d+\//, '/$1/1024/');
  if (url.includes('techcrunch.com')) return `${url.split('?')[0]}?w=1024`;
  return url;
};

export const parseRSSXML = (xmlText, category, sourceName) => {
  const items = extractRssItems(xmlText);
  const now = Date.now();
  const cutoff = now - 3 * 24 * 60 * 60 * 1000;

  return items
    .filter((item) => {
      const pubDateText = extractTagText(item, 'pubDate') || extractTagText(item, 'updated') || extractTagText(item, 'published');
      const time = new Date(pubDateText).getTime();
      return Number.isFinite(time) && time >= cutoff;
    })
    .slice(0, 6)
    .map((item, index) => {
      const title = stripHtml(extractTagText(item, 'title'));
      const description = extractTagText(item, 'description') || extractTagText(item, 'content:encoded') || extractTagText(item, 'summary') || extractTagText(item, 'content');
      const cleanSummary = stripHtml(description).slice(0, 200);
      const imageUrl = upscaleImageUrl(extractImageUrlFromItemXml(item), category);
      const link = extractLinkFromItemXml(item);
      const timestamp = extractTagText(item, 'pubDate') || extractTagText(item, 'updated') || extractTagText(item, 'published') || new Date().toISOString();

      return {
        id: `rss-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        summary: cleanSummary || `${sourceName} RSS`,
        source: sourceName,
        url: link,
        category,
        timestamp,
        imageUrl,
        tags: [category, 'RSS（降级）'],
        syncDate: new Date().toISOString().split('T')[0]
      };
    })
    .filter((item) => item.title && item.url);
};

export const fetchRssCategory = async (category) => {
  const urls = RSS_SOURCES[category] || [];
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; GlobalPulse/1.0; +https://vercel.com)'
        }
      });
      if (!response.ok) return [];
      const xml = await response.text();
      const hostname = new URL(url).hostname.replace('www.', '').toUpperCase();
      return parseRSSXML(xml, category, hostname);
    } catch {
      return [];
    }
  }));

  return results.flat();
};
