/// <reference types="vite/client" />
import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, NewsCategory } from "./types";
// Import keyword library for fallback tagging
import { getKeywordLibrary } from "./keywordLibrary";

// Use VITE_API_KEY for client-side, fallback to simple process.env usage but note vite validation might complain
// To be safe in TS, we use import.meta.env only if available or cast
const apiKey = import.meta.env.VITE_API_KEY || (process as any).env?.VITE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const RSS_SOURCES: Record<string, string[]> = {
  [NewsCategory.POLITICS]: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'http://edition.cnn.com/services/rss/edition_world.rss',
    'https://feeds.skynews.com/feeds/rss/world.xml',
    'https://www.chinanews.com.cn/rss/world.xml', // 中新网国际 (Confirmed Active)
    'https://www.chinanews.com.cn/rss/scroll-news.xml' // 中新网滚动
  ],
  [NewsCategory.FINANCE]: [
    'https://finance.yahoo.com/news/rssindex',
    'https://www.investing.com/rss/news.rss', // Investing.com (Confirmed Active)
    'https://www.chinanews.com.cn/rss/finance.xml', // 中新网财经
    'http://www.ftchinese.com/rss/news' // FT中文网
  ],
  [NewsCategory.AI]: [
    'https://techcrunch.com/category/artificial-intelligence/feed/',
    'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    'https://36kr.com/feed', // 36Kr (Confirmed Active)
    'https://www.chinanews.com.cn/rss/it.xml' // 中新网IT
  ],
  [NewsCategory.ENTERTAINMENT]: [
    'https://variety.com/feed/',
    'https://www.hollywoodreporter.com/feed/',
    'https://www.chinanews.com.cn/rss/yl.xml', // 中新网娱乐
    'https://rss.hub.app/bilibili/ranking/0/3' // Bilibili Ranking via RSSHub (Optional)
  ]
};

const upscaleImageUrl = (url: string, category: NewsCategory = NewsCategory.POLITICS): string => {
  // Global Fallbacks per category if URL is empty
  if (!url) {
    switch (category) {
      case NewsCategory.POLITICS: return `https://images.unsplash.com/photo-1529101091760-6149390da799?auto=format&fit=crop&q=80&w=1000`; // Abstract Map
      case NewsCategory.FINANCE: return `https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&q=80&w=1000`; // Chart
      case NewsCategory.AI: return `https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000`; // AI Chip
      case NewsCategory.ENTERTAINMENT: return `https://images.unsplash.com/photo-1499364660878-4a30795245c4?auto=format&fit=crop&q=80&w=1000`; // Stage
      default: return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000`; // Generic News
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

  // Filter by Freshness (Last 3 Days) & Limit to 15
  const items = allItems.filter(item => {
    const pubDateText = item.querySelector("pubDate")?.textContent;
    if (!pubDateText) return false;
    const pubDate = new Date(pubDateText);
    return pubDate >= threeDaysAgo;
  }).slice(0, 15);

  return items.map((item, index) => {
    const title = item.querySelector("title")?.textContent || "";
    const description = item.querySelector("description")?.textContent || "";
    // Clean CDATA and HTML tags
    const cleanDesc = description.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').slice(0, 200).trim() + "...";

    // Attempt to find image in description or enclosure
    let imageUrl = "";
    const enclosure = item.querySelector("enclosure");
    if (enclosure?.getAttribute("type")?.startsWith("image")) {
      imageUrl = enclosure.getAttribute("url") || "";
    }
    // 2. Check <media:thumbnail> or <media:content> (Common in BBC, Reuters)
    if (!imageUrl) {
      const media = item.getElementsByTagName("media:thumbnail")[0] || item.getElementsByTagName("media:content")[0];
      if (media) imageUrl = media.getAttribute("url") || "";
    }

    // 3. Check <img> tag in description (Common in Chinese feeds like 36Kr, People.cn)
    if (!imageUrl) {
      // Regex to catch src='...' or src="..."
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
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
      // Use AllOrigins as CORS proxy which is more lenient than rss2json
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return [];
      const xmlText = await res.text();

      const hostname = new URL(url).hostname.replace('www.', '').toUpperCase();
      const rawItems = parseRSSXML(xmlText, category, hostname);

      return rawItems.map((item: any, index: number) => {
        // Extract tags from title + summary
        const combinedText = `${item.title} ${item.description}`;
        const tags = extractTagsFallback(combinedText, category);
        if (!tags.includes("RSS（降级）")) tags.push("RSS（降级）");

        return {
          id: `rss-${btoa(item.link).slice(0, 12)}-${index}`,
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
  const today = new Date().toISOString().split('T')[0];
  try {
    const searchPrompt = `Search for the 10 most critical global news SPECIFICALLY about "${category}". 
    CRITICAL REQUIREMENT: The result MUST contain a 50/50 mix of:
    1. International top-tier media (Reuters, BBC, CNN, Bloomberg, The Verge etc.)
    2. Chinese top-tier media (Sina, Tencent, Toutiao, 36Kr, People.cn etc.)
    
    Ensure all summaries are professional and in Chinese.
    IMPORTANT: Extract 3-5 key entities (Person, Company, Location, Topic) into the 'tags' array for each article.
    IMPORTANT: ONLY return news related to ${category}. Do NOT include entertainment news in politics or finance.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: searchPrompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const structurer = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Transform this news into JSON. 
      CRITICAL: Filter out any articles that do NOT strictly belong to the category "${category}".
      Ensure Category field is EXACTLY "${category}". 
      IMPORTANT: Translate the 'source' field into generally accepted Chinese media names.
      IMPORTANT: Populate "tags" with 3-5 specific keywords.
      Input: ${response.text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              source: { type: Type.STRING },
              url: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 key entities/topics" }
            },
            required: ["title", "summary", "source", "url", "tags"]
          }
        }
      }
    });

    const articles = JSON.parse(structurer.text.trim());
    return articles.map((a: any, index: number) => ({
      ...a,
      id: `ai-${btoa(a.url).slice(0, 12)}-${index}`,
      category: category,
      syncDate: today,
      imageUrl: upscaleImageUrl(a.imageUrl),
      timestamp: a.timestamp || new Date().toISOString(),
      tags: (a.tags || []).map((t: string) => t.trim()).filter((t: string) => t.length > 0)
    }));
  } catch (e: any) {
    if (e.message?.includes('429') || e.status === 429) {
      console.warn(`[Gemini] Rate limit exceeded for ${category}. Falling back to RSS.`);
    } else {
      console.error(`[Gemini] Error fetching ${category}:`, e);
    }
    return fetchFromRSS(category);
  }
};
