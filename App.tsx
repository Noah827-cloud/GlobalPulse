
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NewsArticle, NewsCategory } from './types';
import { syncNewsForCategory } from './geminiService';
import { shouldRunScheduledSync } from './schedule';
import { filterRecentArticles } from './articleRetention';
import { fetchHotlistNewsForCategory, getAllHotlistSourceConfigs } from './hotlistService';
import { filterRemovedSources } from './sourceCleanup';
import NewsCard from './components/NewsCard';
import ArticleModal from './components/ArticleModal';
import ConfirmModal from './components/ConfirmModal';
import KeywordBar from './components/KeywordBar';
import SettingsModal from './components/SettingsModal';

type SyncFeedbackState = {
  status: 'idle' | 'running' | 'success' | 'error';
  summary: string | null;
  details: string[];
};

type CategorySyncReport = {
  category: NewsCategory;
  rssCount: number;
  hotlistCount: number;
  totalCount: number;
  errors: string[];
};
const App: React.FC = () => {
  // 初始加载
  const [allArticles, setAllArticles] = useState<NewsArticle[]>(() => {
    const saved = localStorage.getItem('global_news_db_v3'); // Invalidate v2 cache to clear bad IDs
    if (!saved) return [];
    try {
      return JSON.parse(saved) as NewsArticle[];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>(NewsCategory.ALL);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedHotlistSource, setSelectedHotlistSource] = useState<string>('weibo');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('last_sync_full'));
  const [lastAutoSyncAt, setLastAutoSyncAt] = useState<string | null>(localStorage.getItem('last_auto_sync_at'));
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedbackState>({
    status: 'idle',
    summary: null,
    details: []
  });

  // New State for Feature 002
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. 过滤逻辑优化：分类筛选
  const categoryArticles = useMemo(() => {
    const sorted = [...allArticles].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (selectedCategory === NewsCategory.HOTLIST) {
      return sorted.filter((a) => a.id.startsWith('hot-') && a.source === getAllHotlistSourceConfigs().find((source) => source.id === selectedHotlistSource)?.name);
    }

    if (selectedCategory === NewsCategory.ALL) {
      return sorted;
    }

    const filtered = sorted.filter(a => {
      return (a.category || '').trim() === (selectedCategory || '').trim();
    });
    return filtered;
  }, [allArticles, selectedCategory, selectedHotlistSource]);

  // 1.5 过滤逻辑优化：关键字筛选 (FR-005)
  const filteredArticles = useMemo(() => {
    if (!selectedKeyword) return categoryArticles;
    const lowerKw = selectedKeyword.toLowerCase();

    console.log(`[Filter] Filtering "${selectedKeyword}" (lower: ${lowerKw}) in ${categoryArticles.length} articles`);

    const result = categoryArticles.filter(a => {
      const titleMatch = a.title.toLowerCase().includes(lowerKw);
      const summaryMatch = a.summary.toLowerCase().includes(lowerKw);
      const tagMatch = a.tags && a.tags.some(t => t.toLowerCase().includes(lowerKw));

      // Debug first few failures/successes
      // if (a.tags?.includes(selectedKeyword)) console.log(`[Filter] Match found in ${a.id}: T=${titleMatch} S=${summaryMatch} Tag=${tagMatch}`);

      return titleMatch || summaryMatch || tagMatch;
    });

    console.log(`[Filter] Result: ${result.length} articles`);
    return result;
  }, [categoryArticles, selectedKeyword]);

  // 当切换分类时，重置筛选
  useEffect(() => {
    setSelectedKeyword(null);
  }, [selectedCategory]);

  // 2. 同步逻辑
  const performFullSync = useCallback(async (isManual: boolean = false) => {
    setLoading(true);
    setSyncFeedback({
      status: 'running',
      summary: '正在通过 RSS 同步新闻...',
      details: []
    });
    console.log("Starting sync...");

    const categoriesToSync = [
      NewsCategory.POLITICS,
      NewsCategory.FINANCE,
      NewsCategory.AI,
      NewsCategory.ENTERTAINMENT
    ];

    try {
      const newlyFetched: NewsArticle[] = [];
      const reports: CategorySyncReport[] = [];
      for (const cat of categoriesToSync) {
        try {
          const [rssResult, hotlistResult] = await Promise.all([
            syncNewsForCategory(cat),
            fetchHotlistNewsForCategory(cat)
          ]);
          const combined = [...rssResult, ...hotlistResult.articles];
          const calibrated = combined.map(a => ({ ...a, category: cat }));
          newlyFetched.push(...calibrated);
          reports.push({
            category: cat,
            rssCount: rssResult.length,
            hotlistCount: hotlistResult.articles.length,
            totalCount: combined.length,
            errors: hotlistResult.errors
          });
        } catch (e) {
          console.error(`Syncing ${cat} failed`, e);
          reports.push({
            category: cat,
            rssCount: 0,
            hotlistCount: 0,
            totalCount: 0,
            errors: [e instanceof Error ? e.message : '未知错误']
          });
        }
      }

      if (newlyFetched.length > 0) {
        setAllArticles(prev => {
          const articleMap = new Map<string, NewsArticle>();
          const recentPrev = filterRemovedSources(filterRecentArticles(prev));
          // 保留旧数据，但如果是手动刷新，可能希望更积极地更新
          // 这里策略：用 URL 做唯一键，新的覆盖旧的
          recentPrev.forEach(a => { if (a.url) articleMap.set(a.url, a) });
          filterRemovedSources(filterRecentArticles(newlyFetched)).forEach(a => { if (a.url) articleMap.set(a.url, a) });

          const updated = Array.from(articleMap.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 500); // 限制最大条数

          localStorage.setItem('global_news_db_v3', JSON.stringify(updated));
          return updated;
        });

        const now = new Date().toLocaleString();
        setLastSyncTime(now);
        localStorage.setItem('last_sync_full', now);
        const categoryReports = reports;
        const zeroHotlist = categoryReports.filter((report) => report.hotlistCount === 0 && report.category !== NewsCategory.AI);
        const zeroRss = categoryReports.filter((report) => report.rssCount === 0);
        setSyncFeedback({
          status: zeroHotlist.length > 0 || zeroRss.length > 0 ? 'error' : 'success',
          summary: `同步完成，共抓取 ${newlyFetched.length} 条内容。`,
          details: categoryReports.map((report) => {
            const warnings = [];
            if (report.rssCount === 0) warnings.push('RSS=0');
            if (report.hotlistCount === 0 && report.category !== NewsCategory.AI) warnings.push('Hotlist=0');
            if (report.errors.length > 0) {
              warnings.push(...report.errors);
            }
            const suffix = warnings.length > 0 ? `，异常: ${warnings.join(' | ')}` : '';
            return `${report.category}：RSS ${report.rssCount} 条，Hotlist ${report.hotlistCount} 条，合计 ${report.totalCount} 条${suffix}`;
          })
        });
      } else {
        setSyncFeedback({
          status: 'error',
          summary: '同步失败，RSS 和 Hotlist 都没有拿到内容。',
          details: ['请检查当前网络是否能访问 RSS 代理服务，以及 newsnow 热榜 API。']
        });
      }
    } catch (error) {
      console.error("Critical sync error:", error);
      setSyncFeedback({
        status: 'error',
        summary: '同步异常中断。',
        details: [error instanceof Error ? error.message : '未知错误']
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. 垃圾桶逻辑：确认后执行
  const executeClearCache = () => {
    console.log("Clearing cache confirmed...");
    localStorage.clear();
    setAllArticles([]);
    setLastSyncTime(null);
    setIsConfirmOpen(false); // 关闭弹窗

    // 立即触发同步
    setTimeout(() => {
      performFullSync(true);
    }, 100);
  };

  const handleTrashClick = () => {
    setIsConfirmOpen(true);
  };

  // 4. 定时任务
  useEffect(() => {
    const interval = setInterval(() => {
      if (loading) {
        return;
      }

      const now = new Date();
      if (shouldRunScheduledSync(now, lastAutoSyncAt)) {
        const executedAt = now.toISOString();
        setLastAutoSyncAt(executedAt);
        localStorage.setItem('last_auto_sync_at', executedAt);
        performFullSync();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [loading, performFullSync, lastAutoSyncAt]);

  // 初始化启动
  useEffect(() => {
    if (allArticles.length === 0) {
      performFullSync(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <header className="sticky top-0 z-40 glass-effect border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="cursor-pointer" onClick={() => setSelectedCategory(NewsCategory.ALL)}>
              <h1 className="text-xl font-black tracking-tighter leading-none uppercase">Global<span className="text-indigo-600">Pulse</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">智能聚合分发</p>
            </div>
          </div>

          {/* 导航栏：优化移动端显示，避免完全隐藏 */}
          <nav className="hidden md:flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
            {Object.values(NewsCategory).filter(c => c !== NewsCategory.CUSTOM).map((cat) => (
              <button
                key={cat}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory(cat);
                }}
                className={`whitespace-nowrap px-4 lg:px-6 py-2 text-sm font-bold rounded-xl transition-all ${selectedCategory === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {cat}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 text-slate-400 hover:text-indigo-600 transition-colors bg-white rounded-xl border border-slate-200"
              title="关键词设置"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleTrashClick}
              className="p-3 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-xl border border-slate-200"
              title="清空缓存"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => performFullSync(true)}
              disabled={loading}
              className={`p-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all ${loading ? 'opacity-50' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* 移动端下方的分类导航，如果上面隐藏了 */}
        <div className="md:hidden px-4 pb-2 overflow-x-auto flex gap-2 no-scrollbar">
          {Object.values(NewsCategory).filter(c => c !== NewsCategory.CUSTOM).map((cat) => (
            <button
              key={cat}
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory(cat);
              }}
              className={`flex-shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition-all border ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter text-slate-900">
              {selectedCategory === NewsCategory.ALL ? '今日焦点' : selectedCategory}
            </h2>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 text-xs font-bold">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                {loading ? '正在同步全球核心资讯...' : lastSyncTime ? `数据已更新于 ${lastSyncTime}` : '待同步'}
              </span>
              <span className="text-sm font-medium opacity-60">
                通过筛选: {filteredArticles.length} / 总计: {categoryArticles.length}
              </span>
            </div>
            {syncFeedback.summary && (
              <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                syncFeedback.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : syncFeedback.status === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <p className="font-semibold">{syncFeedback.summary}</p>
                {syncFeedback.details.map((detail) => (
                  <p key={detail} className="mt-1 opacity-90">{detail}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Keyword Bar Component */}
        {selectedCategory === NewsCategory.HOTLIST ? (
          <div className="flex gap-2.5 mb-8 overflow-x-auto no-scrollbar">
            {getAllHotlistSourceConfigs().map((source) => (
              <button
                key={source.id}
                onClick={() => setSelectedHotlistSource(source.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  selectedHotlistSource === source.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
        ) : (
          <KeywordBar
            articles={categoryArticles}
            selectedKeyword={selectedKeyword}
            onSelectKeyword={setSelectedKeyword}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {filteredArticles.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-400 uppercase">
              {selectedKeyword ? `没有找到关于 "${selectedKeyword}" 的结果` : loading ? '正在同步内容...' : `暂无「${selectedCategory}」数据`}
            </h3>
            {!loading && (
              <button
                onClick={() => selectedKeyword ? setSelectedKeyword(null) : performFullSync(true)}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all"
              >
                {selectedKeyword ? '清除筛选' : '立即抓取最新资讯'}
              </button>
            )}
          </div>
        ) : (
          <div key={selectedCategory} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {filteredArticles.map(article => (
              <NewsCard
                key={article.id}
                article={article}
                onClick={setSelectedArticle}
                onTagClick={setSelectedKeyword}
              />
            ))}
          </div>
        )}
      </main>

      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeywordsChange={() => {/* No global state to refresh really needed, as library is direct local storage, and next fetch picks it up */ }}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        message="确定要清空本地所有缓存数据并重新从全球数据源同步吗？此操作不可撤销。"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={executeClearCache}
      />
    </div>
  );
};

export default App;
