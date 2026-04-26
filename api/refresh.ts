import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del, list, put } from '@vercel/blob';

const BLOB_PATH = 'feeds/latest.json';
const NewsCategory = {
  POLITICS: '时政',
  FINANCE: '财经',
  AI: '人工智能',
  ENTERTAINMENT: '娱乐'
} as const;

type NewsCategory = typeof NewsCategory[keyof typeof NewsCategory];

type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  source: string;
  url: string;
  timestamp: string;
  imageUrl: string;
  tags: string[];
  syncDate: string;
};

type HotlistApiItem = {
  id?: string | number;
  title?: string;
  url?: string;
  mobileUrl?: string;
  extra?: {
    hover?: string;
    icon?: {
      url?: string;
    };
  };
};

type HotlistApiResponse = {
  updatedTime?: number;
  items?: HotlistApiItem[];
};

type HotlistFetchResult = {
  articles: NewsArticle[];
  errors: string[];
};

type HotlistSourceConfig = {
  id: string;
  name: string;
  category: NewsCategory;
};

const RSS_SOURCES: Record<string, string[]> = {
  [NewsCategory.POLITICS]: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://feeds.skynews.com/feeds/rss/world.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'
  ],
  [NewsCategory.FINANCE]: [
    'https://finance.yahoo.com/news/rssindex',
    'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    'https://www.marketwatch.com/rss/topstories',
    'https://www.investing.com/rss/news.rss',
    'https://www.ft.com/rss/home'
  ],
  [NewsCategory.AI]: [
    'https://techcrunch.com/category/artificial-intelligence/feed/',
    'http://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    'http://a.jiemian.com/index.php?m=article&a=rss',
    'https://www.huxiu.com/rss/0.xml',
    'https://www.bestblogs.dev/zh/feeds/rss',
    'https://www.36kr.com/feed',
    'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en'
  ],
  [NewsCategory.ENTERTAINMENT]: [
    'https://variety.com/feed/',
    'https://www.hollywoodreporter.com/feed/',
    'https://www.huxiu.com/rss/0.xml',
    'https://www.etonline.com/news/rss',
    'https://news.google.com/rss/search?q=entertainment&hl=en-US&gl=US&ceid=US:en'
  ]
};

const HOTLIST_SOURCES: HotlistSourceConfig[] = [
  { id: 'weibo', name: '微博热搜', category: NewsCategory.ENTERTAINMENT },
  { id: 'baidu', name: '百度热搜', category: NewsCategory.POLITICS },
  { id: 'wallstreetcn-hot', name: '华尔街见闻', category: NewsCategory.FINANCE },
  { id: 'thepaper', name: '澎湃新闻', category: NewsCategory.POLITICS },
  { id: 'cls-hot', name: '财联社热门', category: NewsCategory.FINANCE },
  { id: 'bilibili-hot-search', name: 'Bilibili 热搜', category: NewsCategory.ENTERTAINMENT }
];

const REMOVED_SOURCE_PATTERNS = [
  'CHINANEWS.COM.CN',
  'CHINANEWS',
  '中新'
];

const MAX_ARTICLE_AGE_DAYS = 3;

const matchFirst = (input: string, pattern: RegExp): string => {
  const match = input.match(pattern);
  return match?.[1]?.trim() ?? '';
};

const extractImageUrlFromItemXml = (itemXml: string): string => {
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

const filterRecentArticles = (
  articles: NewsArticle[],
  now: Date = new Date(),
  maxAgeDays: number = MAX_ARTICLE_AGE_DAYS
): NewsArticle[] => {
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;

  return articles.filter((article) => {
    const timestamp = new Date(article.timestamp).getTime();
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  });
};

const filterRemovedSources = (articles: NewsArticle[]): NewsArticle[] => (
  articles.filter((article) => {
    const source = `${article.source || ''} ${article.url || ''}`.toUpperCase();
    return !REMOVED_SOURCE_PATTERNS.some((pattern) => source.includes(pattern));
  })
);

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

const decodeXmlEntities = (input: string): string => (
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

const stripHtml = (input: string): string => (
  decodeXmlEntities(input)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

const extractTagText = (input: string, tagName: string): string => {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)</${escaped}>`, 'i');
  return decodeXmlEntities(matchFirst(input, pattern));
};

const extractRssItems = (xmlText: string): string[] => {
  const itemMatches = Array.from(xmlText.matchAll(/<item\b[\s\S]*?<\/item>/gi)).map((match) => match[0]);
  if (itemMatches.length > 0) return itemMatches;
  return Array.from(xmlText.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)).map((match) => match[0]);
};

const extractLinkFromItemXml = (itemXml: string): string => {
  const textLink = extractTagText(itemXml, 'link');
  if (textLink) return textLink;

  const hrefLink = matchFirst(itemXml, /<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return decodeXmlEntities(hrefLink);
};

const getHotlistSourcesForCategory = (category: NewsCategory): HotlistSourceConfig[] => (
  HOTLIST_SOURCES.filter((source) => source.category === category)
);

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

const upscaleImageUrl = (url: string, category: NewsCategory): string => {
  if (!url) return getFallbackImage(category);
  if (url.includes('ichef.bbci.co.uk')) return url.replace(/\/(news|cps)\/\d+\//, '/$1/1024/');
  if (url.includes('techcrunch.com')) return `${url.split('?')[0]}?w=1024`;
  return url;
};

const getHotlistSourceImage = (sourceId: string, category: NewsCategory): string => {
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

const getHotlistSummary = (item: HotlistApiItem): string => {
  const hover = item.extra?.hover?.trim();
  return hover ? sanitizeHotlistSummary(hover).slice(0, 120) : '';
};

const parseRSSXML = (xmlText: string, category: NewsCategory, sourceName: string) => {
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
      } satisfies NewsArticle;
    })
    .filter((item) => item.title && item.url);
};

const fetchRssCategory = async (category: NewsCategory): Promise<NewsArticle[]> => {
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

const fetchHotlistPayload = async (sourceId: string): Promise<HotlistApiResponse> => {
  const targetUrl = `https://newsnow.busiyi.world/api/s?id=${sourceId}&latest`;
  const proxyUrls = [
    targetUrl,
    `https://r.jina.ai/http://newsnow.busiyi.world/api/s?id=${sourceId}&latest`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  let lastError: Error | null = null;

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
      return JSON.parse(payload) as HotlistApiResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('未知错误');
    }
  }

  throw lastError ?? new Error('Hotlist proxy failed');
};

const mapHotlistItems = (
  items: HotlistApiItem[],
  source: HotlistSourceConfig,
  category: NewsCategory,
  today: string,
  updatedTime: string
): NewsArticle[] => (
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

const fetchHotlistNewsForCategory = async (category: NewsCategory): Promise<HotlistFetchResult> => {
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
      errors.push(`${source.name}: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  return { articles, errors };
};

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const categories = [
    NewsCategory.POLITICS,
    NewsCategory.FINANCE,
    NewsCategory.AI,
    NewsCategory.ENTERTAINMENT
  ];

  try {
    const reports: Array<{ category: NewsCategory; rssCount: number; hotlistCount: number; totalCount: number; errors: string[] }> = [];
    const allArticles: NewsArticle[] = [];

    for (const category of categories) {
      const [rssArticles, hotlistResult] = await Promise.all([
        fetchRssCategory(category),
        fetchHotlistNewsForCategory(category)
      ]);

      const merged = [...rssArticles, ...hotlistResult.articles].map((article) => ({ ...article, category }));
      allArticles.push(...merged);
      reports.push({
        category,
        rssCount: rssArticles.length,
        hotlistCount: hotlistResult.articles.length,
        totalCount: merged.length,
        errors: hotlistResult.errors
      });
    }

    const articles = filterRemovedSources(filterRecentArticles(allArticles))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 500);

    const lastSyncTime = new Date().toLocaleString('zh-CN');
    const payload = {
      articles,
      lastSyncTime,
      syncFeedback: {
        status: reports.some((report) => (report.category !== NewsCategory.AI && report.hotlistCount === 0) || report.rssCount === 0) ? 'error' : 'success',
        summary: `同步完成，共抓取 ${articles.length} 条内容。`,
        details: reports.map((report) => {
          const warnings = [];
          if (report.rssCount === 0) warnings.push('RSS=0');
          if (report.hotlistCount === 0 && report.category !== NewsCategory.AI) warnings.push('Hotlist=0');
          if (report.errors.length > 0) warnings.push(...report.errors);
          return `${report.category}：RSS ${report.rssCount} 条，Hotlist ${report.hotlistCount} 条，合计 ${report.totalCount} 条${warnings.length ? `，异常: ${warnings.join(' | ')}` : ''}`;
        })
      }
    };

    const existing = await list({ prefix: BLOB_PATH, limit: 10 });
    const staleUrls = existing.blobs
      .filter((blob) => blob.pathname === BLOB_PATH)
      .map((blob) => blob.url);

    if (staleUrls.length > 0) {
      await del(staleUrls);
    }

    await put(BLOB_PATH, JSON.stringify(payload), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json'
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown refresh error' });
  }
}
