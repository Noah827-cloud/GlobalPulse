import type { NewsArticle } from './types';

export const MAX_ARTICLE_AGE_DAYS = 3;

export const filterRecentArticles = (
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
