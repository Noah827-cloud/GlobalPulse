import React from 'react';
import { NewsArticle } from '../types';
import { hasMeaningfulHotlistSummary } from '../hotlistService';

interface HotlistQueueProps {
  articles: NewsArticle[];
  onSelect: (article: NewsArticle) => void;
}

const HotlistQueue: React.FC<HotlistQueueProps> = ({ articles, onSelect }) => {
  if (articles.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/70 overflow-hidden">
      <div className="px-6 md:px-8 py-5 border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_100%)]">
        <h3 className="text-lg md:text-xl font-black tracking-tight text-slate-900">热榜队列</h3>
        <p className="text-sm text-slate-500 mt-1">按来源聚合的当日热门话题，强调标题、摘要和跳转效率。</p>
      </div>

      <div className="divide-y divide-slate-100">
        {articles.map((article, index) => (
          <button
            key={article.id}
            onClick={() => onSelect(article)}
            className="w-full text-left px-6 md:px-8 py-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                    {article.source}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold border border-slate-200">
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(article.timestamp).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <h4 className="text-lg md:text-xl font-bold text-slate-900 leading-snug mb-2">
                  {article.title}
                </h4>

                {hasMeaningfulHotlistSummary(article.summary) ? (
                  <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                    <span>原榜链接</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>点击查看详情</span>
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center text-indigo-600 font-black text-xs tracking-widest flex-shrink-0">
                查看
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HotlistQueue;
