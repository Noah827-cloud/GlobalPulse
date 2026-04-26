/// <reference types="vite/client" />
import { NewsArticle, NewsCategory } from "./types";
// Import keyword library for fallback tagging
import { getKeywordLibrary } from "./keywordLibrary";
import { extractImageUrlFromItemXml } from "./rssImageExtraction";

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
    'http://feeds.arstechnica.com/arstechnica/technology-lab', // Ars Technica (Reliable)
    'https://www.technologyreview.com/topic/artificial-intelligence/feed', // MIT Tech Review
    'http://a.jiemian.com/index.php?m=article&a=rss', // 界面新闻
    'https://www.huxiu.com/rss/0.xml', // 虎嗅
    'https://www.bestblogs.dev/zh/feeds/rss', // BestBlogs (User Requested)
    'https://www.36kr.com/feed', // 36Kr (User Requested)
    'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en' // 保底补量
  ],
  [NewsCategory.ENTERTAINMENT]: [
    'https://variety.com/feed/',
    'https://www.hollywoodreporter.com/feed/',
    'https://www.huxiu.com/rss/0.xml', // 虎嗅 (含图片/文化娱乐)
    'https://www.etonline.com/news/rss',
    'https://news.google.com/rss/search?q=entertainment&hl=en-US&gl=US&ceid=US:en'
  ]
};

const upscaleImageUrl = (url: string, category: NewsCategory = NewsCategory.POLITICS): string => {
  // Global Fallbacks per category if URL is empty
  // Now using local images downloaded to public/fallback/ for reliability
  if (!url) {
    switch (category) {
      case NewsCategory.POLITICS: return `/fallback/politics.jpg`;
      case NewsCategory.FINANCE: return `/fallback/finance.jpg`;
      case NewsCategory.AI: return `/fallback/ai.jpg`;
      case NewsCategory.ENTERTAINMENT: return `/fallback/entertainment.jpg`;
      default: return `/fallback/general.jpg`;
    }
  }

  if (url.includes('ichef.bbci.co.uk')) return url.replace(/\/(news|cps)\/\d+\//, '/$1/1024/');
  if (url.includes('techcrunch.com')) return url.split('?')[0] + '?w=1024';
  if (url.includes('reuters.com')) return url.replace('width=20', 'width=1000');
  if (url.includes('sina.com')) return url;
  return url;
};

// Helper: Extract tags from text using local Keyword Library (RSS Fallback)
const extractTagsFallback = (text: string, category: NewsCategory): string[] => {
  const library = getKeywordLibrary();
  // Safe simple matching: check if keyword appears in text
  const matched = library.filter(keyword => {
    try {
      // Escape special regex chars if any, though keywords are usually simple
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      return regex.test(text);
    } catch { return false; }
  });

  // Always include category as a base tag
  const tags = Array.from(new Set([category, ...matched]));
  return tags.slice(0, 5); // Limit to 5 tags
};

// Helper: Parse XML string to NewsArticle[]
const parseRSSXML = (xmlText: string, category: NewsCategory, sourceName: string): any[] => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const allItems = Array.from(xml.querySelectorAll("item"));

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Filter by Freshness (Last 3 Days)
  const freshItems = allItems.filter(item => {
    const pubDateText = item.querySelector("pubDate")?.textContent;
    if (!pubDateText) return false;
    const pubDate = new Date(pubDateText);
    return pubDate >= threeDaysAgo;
  });

  // 2. Limit to 6 items per feed to ensure diversity (User requested ~5 per source)
  return freshItems.slice(0, 6).map((item, index) => {
    const title = item.querySelector("title")?.textContent || "";
    const description = item.querySelector("description")?.textContent || "";
    // Clean CDATA and HTML tags
    const cleanDesc = description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').slice(0, 200).trim() + "...";

    const itemXml = item.outerHTML || new XMLSerializer().serializeToString(item);
    let imageUrl = extractImageUrlFromItemXml(itemXml);

    // Proxy the image through wsrv.nl to bypass hotlinking protection and optimize format
    if (imageUrl && !imageUrl.startsWith('https://images.unsplash.com')) {
      // Only proxy if it's not our fallback unsplash images (though proxying them is fine too)
      // We use wsrv.nl which is a robust global image proxy
      imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=800&output=webp`;
    }



    const link = item.querySelector("link")?.textContent || "";
    const pubDate = item.querySelector("pubDate")?.textContent || "";

    return {
      title: title,
      description: cleanDesc,
      link: link,
      pubDate: pubDate,
      imageUrl: imageUrl,
      author: sourceName
    };
  });
}

const fetchFromRSS = async (category: NewsCategory): Promise<NewsArticle[]> => {
  const urls = RSS_SOURCES[category] || [];
  const today = new Date().toISOString().split('T')[0];

  const results = await Promise.all(urls.map(async (url) => {
    try {
      // Try generic CORS proxies with fallback
      let xmlText = "";
      try {
        const proxyUrl1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const res1 = await fetch(proxyUrl1, { signal: AbortSignal.timeout(5000) });
        if (res1.ok) {
          xmlText = await res1.text();
        } else {
          throw new Error("Proxy 1 failed");
        }
      } catch (e) {
        // Fallback to corsproxy.io
        console.warn(`Proxy 1 failed for ${url}, trying fallback...`);
        try {
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          const res2 = await fetch(proxyUrl2, { signal: AbortSignal.timeout(8000) });
          if (!res2.ok) throw new Error("Proxy 2 failed");
          xmlText = await res2.text();
        } catch (e2) {
          console.error(`All proxies failed for ${url}`, e2);
          return [];
        }
      }

      const hostname = new URL(url).hostname.replace('www.', '').toUpperCase();
      const rawItems = parseRSSXML(xmlText, category, hostname);

      return rawItems.map((item: any, index: number) => {
        // Extract tags from title + summary
        const combinedText = `${item.title} ${item.description}`;
        const tags = extractTagsFallback(combinedText, category);
        if (!tags.includes("RSS（降级）")) tags.push("RSS（降级）");

        // Generate a simplified unique ID that avoids prefix collision issues
        // We use Math.random() and Date.now() to ensure uniqueness within the session
        // This solves the 'Duplicate Key' crash caused by slicing base64 common prefixes
        const safeId = `rss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${index}`;

        return {
          id: safeId,
          title: item.title,
          summary: item.description,
          source: item.author,
          url: item.link,
          category: category,
          timestamp: item.pubDate,
          imageUrl: upscaleImageUrl(item.imageUrl, category), // Pass category for intelligent fallback
          tags: tags,
          syncDate: today
        };
      });
    } catch (e) {
      console.warn(`RSS Fetch failed for ${url}`, e);
      return [];
    }
  }));
  return results.flat();
};

export const syncNewsForCategory = async (category: NewsCategory): Promise<NewsArticle[]> => {
  return fetchFromRSS(category);
};
