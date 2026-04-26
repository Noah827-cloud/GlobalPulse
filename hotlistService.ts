import { NewsArticle, NewsCategory } from './types.ts';
import { getAllHotlistSources, getHotlistSourcesForCategoryLabel } from './hotlistSources';

type HotlistApiItem = {
  id?: string | number;
  title?: string;
  url?: string;
  mobileUrl?: string;
  extra?: {
    hover?: string;
    icon?: {
      url?: string;
      scale?: number;
    };
  };
};

type HotlistApiResponse = {
  status?: string;
  updatedTime?: number;
  items?: HotlistApiItem[];
};

export type HotlistFetchResult = {
  articles: NewsArticle[];
  errors: string[];
};

const DETAIL_SUMMARY_SOURCE_IDS = new Set(['wallstreetcn-hot', 'cls-hot', 'thepaper']);

export const getHotlistSourcesForCategory = (category: NewsCategory) => (
  getHotlistSourcesForCategoryLabel(category as unknown as '时政' | '财经' | '人工智能' | '娱乐')
);

export const getAllHotlistSourceConfigs = getAllHotlistSources;

const getFallbackImage = (category: NewsCategory): string => {
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

export const getHotlistSourceImage = (sourceId: string, category: NewsCategory): string => {
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

const GENERIC_SUMMARY_PATTERNS = [
  '热门话题',
  '点击查看原始热榜详情',
  '澎湃，澎湃新闻',
];

const sanitizeHotlistSummary = (input: string): string => (
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

const getHotlistSummary = (sourceName: string, item: HotlistApiItem): string => {
  const hover = item.extra?.hover?.trim();
  if (hover) {
    return sanitizeHotlistSummary(hover).slice(0, 120);
  }

  return '';
};

export const hasMeaningfulHotlistSummary = (summary: string): boolean => {
  const trimmed = sanitizeHotlistSummary(summary);
  if (!trimmed) return false;
  if (trimmed.startsWith('[') || trimmed.startsWith('![')) return false;
  return !GENERIC_SUMMARY_PATTERNS.some((pattern) => trimmed.includes(pattern));
};

const fetchDetailSummary = async (url: string): Promise<string> => {
  const useLocalProxy = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  if (useLocalProxy) {
    const response = await fetch(`/api/summary?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) {
      throw new Error(`Summary proxy failed: ${response.status}`);
    }
    const data = await response.json() as { summary?: string };
    return sanitizeHotlistSummary((data.summary || '').trim());
  }

  const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
  const response = await fetch(proxyUrl, {
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) {
    throw new Error(`Summary proxy failed: ${response.status}`);
  }

  const text = await response.text();
  const body = text.split('Markdown Content:').pop()?.trim() || '';
  const candidate = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 40 && !line.startsWith('{') && !line.startsWith('Title:'));

  return sanitizeHotlistSummary(candidate?.slice(0, 180) || '');
};

const fetchHotlistPayload = async (sourceId: string): Promise<HotlistApiResponse> => {
  const targetUrl = `https://newsnow.busiyi.world/api/s?id=${sourceId}&latest`;
  const useLocalProxy = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  const proxyUrls = [
    `https://r.jina.ai/http://newsnow.busiyi.world/api/s?id=${sourceId}&latest`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  let lastError: Error | null = null;

  if (useLocalProxy) {
    try {
      const response = await fetch(`/api/hotlist?id=${encodeURIComponent(sourceId)}`, {
        signal: AbortSignal.timeout(12000)
      });

      if (!response.ok) {
        throw new Error(`Local hotlist proxy failed: ${response.status}`);
      }

      return await response.json() as HotlistApiResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误');
    }
  }

  for (const proxyUrl of proxyUrls) {
    try {
      const proxied = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(proxyUrl.includes('r.jina.ai') ? 12000 : 35000)
      });

      if (!proxied.ok) {
        throw new Error(`Hotlist proxy failed: ${proxied.status}`);
      }

      const text = await proxied.text();
      const jsonStart = text.indexOf('{"status"');
      const payload = jsonStart >= 0 ? text.slice(jsonStart) : text;
      return JSON.parse(payload) as HotlistApiResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误');
    }
  }

  throw lastError ?? new Error('Hotlist proxy failed');
};

const mapHotlistItems = (
  items: HotlistApiItem[],
  source: { id: string; name: string },
  category: NewsCategory,
  today: string,
  updatedTime: string
): NewsArticle[] => {
  return items.slice(0, 10).map((item, index) => ({
    id: `hot-${source.id}-${String(item.id ?? index)}`,
    title: String(item.title || '').trim(),
    summary: getHotlistSummary(source.name, item),
    category,
    source: source.name,
    url: item.mobileUrl || item.url || '#',
    timestamp: updatedTime,
    imageUrl: item.extra?.icon?.url || getHotlistSourceImage(source.id, category),
    tags: [category, '国内热点', source.name],
    syncDate: today
  })).filter((item) => item.title && item.url && item.url !== '#');
};

export const fetchHotlistNewsForCategory = async (category: NewsCategory): Promise<HotlistFetchResult> => {
  const today = new Date().toISOString().split('T')[0];
  const sources = getHotlistSourcesForCategory(category);
  const errors: string[] = [];
  const articles: NewsArticle[] = [];

  for (const source of sources) {
    try {
      const data = await fetchHotlistPayload(source.id);
      const updatedTime = data.updatedTime ? new Date(data.updatedTime).toISOString() : new Date().toISOString();
      const mapped = mapHotlistItems(data.items || [], source, category, today, updatedTime);

      if (DETAIL_SUMMARY_SOURCE_IDS.has(source.id)) {
        for (const article of mapped.slice(0, 5)) {
          if (!hasMeaningfulHotlistSummary(article.summary)) {
            try {
              const enrichedSummary = await fetchDetailSummary(article.url);
              if (hasMeaningfulHotlistSummary(enrichedSummary)) {
                article.summary = enrichedSummary;
              }
            } catch (error) {
              console.warn(`[Hotlist] Summary enrich failed for ${source.id}:`, error);
            }
          }
        }
      }

      articles.push(...mapped);
    } catch (error) {
      console.warn(`[Hotlist] Failed to fetch ${source.id}:`, error);
      errors.push(`${source.name}: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  return {
    articles,
    errors
  };
};
