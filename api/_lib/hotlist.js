import { HOTLIST_SOURCES, NewsCategory } from './shared.js';

const sanitizeHotlistSummary = (input) => (
  input
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/!\[[^\]]*\]:?\s*[^\s]+/g, ' ')
    .replace(/\((https?:\/\/[^)]+)\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/Markdown Content:/gi, ' ')
    .replace(/Title:\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const getHotlistSourcesForCategory = (category) => (
  HOTLIST_SOURCES.filter((source) => source.category === category)
);

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

const getHotlistSourceImage = (sourceId, category) => {
  switch (sourceId) {
    case 'weibo':
      return 'https://simg.s.weibo.com/moter/flags/1_0.png';
    case 'bilibili-hot-search':
      return '/fallback/entertainment.jpg';
    case 'wallstreetcn-hot':
    case 'cls-hot':
      return '/fallback/finance.jpg';
    case 'baidu':
    case 'thepaper':
      return '/fallback/politics.jpg';
    default:
      return getFallbackImage(category);
  }
};

const getHotlistSummary = (item) => {
  const hover = item.extra?.hover?.trim();
  return hover ? sanitizeHotlistSummary(hover).slice(0, 120) : '';
};

const fetchHotlistPayload = async (sourceId) => {
  const targetUrl = `https://newsnow.busiyi.world/api/s?id=${sourceId}&latest`;
  const proxyUrls = [
    targetUrl,
    `https://r.jina.ai/http://newsnow.busiyi.world/api/s?id=${sourceId}&latest`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  let lastError = null;

  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl, {
        headers: {
          accept: 'application/json,text/plain,*/*',
          'user-agent': 'Mozilla/5.0 (compatible; GlobalPulse/1.0; +https://vercel.com)',
          referer: 'https://newsnow.busiyi.world/',
          origin: 'https://newsnow.busiyi.world'
        },
        signal: AbortSignal.timeout(proxyUrl.includes('allorigins') ? 35000 : 12000)
      });

      if (!response.ok) {
        throw new Error(`Hotlist proxy failed: ${response.status}`);
      }

      const text = await response.text();
      const jsonStart = text.indexOf('{"status"');
      const payload = jsonStart >= 0 ? text.slice(jsonStart) : text;
      return JSON.parse(payload);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误');
    }
  }

  throw lastError ?? new Error('Hotlist proxy failed');
};

const mapHotlistItems = (items, source, category, today, updatedTime) => (
  items
    .slice(0, 10)
    .map((item, index) => ({
      id: `hot-${source.id}-${String(item.id ?? index)}`,
      title: String(item.title || '').trim(),
      summary: getHotlistSummary(item),
      category,
      source: source.name,
      url: item.mobileUrl || item.url || '#',
      timestamp: updatedTime,
      imageUrl: item.extra?.icon?.url || getHotlistSourceImage(source.id, category),
      tags: [category, '国内热点', source.name],
      syncDate: today
    }))
    .filter((item) => item.title && item.url && item.url !== '#')
);

export const fetchHotlistNewsForCategory = async (category) => {
  const today = new Date().toISOString().split('T')[0];
  const sources = getHotlistSourcesForCategory(category);
  const errors = [];
  const articles = [];

  for (const source of sources) {
    try {
      const data = await fetchHotlistPayload(source.id);
      const updatedTime = data.updatedTime ? new Date(data.updatedTime).toISOString() : new Date().toISOString();
      articles.push(...mapHotlistItems(data.items || [], source, category, today, updatedTime));
    } catch (error) {
      errors.push(`${source.name}: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  return { articles, errors };
};
