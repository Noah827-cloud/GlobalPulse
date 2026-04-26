import type { NewsArticle } from './types';

const REMOVED_SOURCE_PATTERNS = [
  'CHINANEWS.COM.CN',
  'CHINANEWS',
  '中新'
];

export const filterRemovedSources = (articles: NewsArticle[]): NewsArticle[] => (
  articles.filter((article) => {
    const source = `${article.source || ''} ${article.url || ''}`.toUpperCase();
    return !REMOVED_SOURCE_PATTERNS.some((pattern) => source.includes(pattern));
  })
);
