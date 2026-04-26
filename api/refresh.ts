import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del, list, put } from '@vercel/blob';
import { JSDOM } from 'jsdom';
import { NewsArticle, NewsCategory } from '../types';
import { extractImageUrlFromItemXml } from '../rssImageExtraction';
import { fetchHotlistNewsForCategory } from '../hotlistService';
import { filterRecentArticles } from '../articleRetention';
import { filterRemovedSources } from '../sourceCleanup';

const BLOB_PATH = 'feeds/latest.json';

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

const parseRSSXML = (xmlText: string, category: NewsCategory, sourceName: string) => {
  const dom = new JSDOM(xmlText, { contentType: 'text/xml' });
  const items = Array.from(dom.window.document.querySelectorAll('item')) as Element[];
  const now = Date.now();
  const cutoff = now - 3 * 24 * 60 * 60 * 1000;

  return items
    .filter((item) => {
      const pubDateText = item.querySelector('pubDate')?.textContent || '';
      const time = new Date(pubDateText).getTime();
      return Number.isFinite(time) && time >= cutoff;
    })
    .slice(0, 6)
    .map((item, index) => {
      const title = item.querySelector('title')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const cleanSummary = description
        .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
      const itemXml = item.outerHTML || new dom.window.XMLSerializer().serializeToString(item);
      const imageUrl = upscaleImageUrl(extractImageUrlFromItemXml(itemXml), category);

      return {
        id: `rss-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        summary: cleanSummary || `${sourceName} RSS`,
        source: sourceName,
        url: item.querySelector('link')?.textContent || '',
        category,
        timestamp: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
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
