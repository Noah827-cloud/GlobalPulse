const REMOVED_SOURCE_PATTERNS = [
  'CHINANEWS.COM.CN',
  'CHINANEWS',
  '中新'
];

const MAX_ARTICLE_AGE_DAYS = 3;

export const filterRecentArticles = (
  articles,
  now = new Date(),
  maxAgeDays = MAX_ARTICLE_AGE_DAYS
) => {
  const cutoff = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;

  return articles.filter((article) => {
    const timestamp = new Date(article.timestamp).getTime();
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  });
};

export const filterRemovedSources = (articles) => (
  articles.filter((article) => {
    const source = `${article.source || ''} ${article.url || ''}`.toUpperCase();
    return !REMOVED_SOURCE_PATTERNS.some((pattern) => source.includes(pattern));
  })
);

export const sortAndLimitArticles = (articles, limit = 500) => (
  [...articles]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
);
