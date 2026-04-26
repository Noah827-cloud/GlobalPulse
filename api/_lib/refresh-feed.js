import { filterRecentArticles, filterRemovedSources, sortAndLimitArticles } from './articles.js';
import { fetchHotlistNewsForCategory } from './hotlist.js';
import { fetchRssCategory } from './rss.js';
import { NewsCategory, SYNC_CATEGORIES } from './shared.js';

export const buildLatestFeedPayload = async () => {
  const reports = [];
  const allArticles = [];

  for (const category of SYNC_CATEGORIES) {
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

  const articles = sortAndLimitArticles(
    filterRemovedSources(filterRecentArticles(allArticles))
  );

  return {
    articles,
    lastSyncTime: new Date().toLocaleString('zh-CN'),
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
};
