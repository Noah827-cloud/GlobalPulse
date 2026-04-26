import { NewsArticle, NewsCategory } from './types.ts';
import { getAllHotlistSources, getHotlistSourcesForCategoryLabel } from './hotlistSources';

type HotlistApiItem = {
  id?: string | number;
  title?: string;
  url?: string;
  mobileUrl?: string;
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
    summary: `${source.name} 热门话题`,
    category,
    source: source.name,
    url: item.mobileUrl || item.url || '#',
    timestamp: updatedTime,
    imageUrl: getHotlistSourceImage(source.id, category),
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
      articles.push(...mapHotlistItems(data.items || [], source, category, today, updatedTime));
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
